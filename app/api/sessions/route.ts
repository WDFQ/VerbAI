import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Sessions API: saves finished conversations to Firestore and lists them for the History page.
 *
 * How a session is stored:
 *   sessions/{sessionId}               label, staffLanguage, clientLanguage, createdAt
 *   sessions/{sessionId}/exchanges/*   one document per message: speaker, staffText, clientText, order
 * The exchanges are a subcollection (not part of the session document) so long conversations
 * don't hit Firestore's document size limit. "order" keeps them in conversation order.
 *
 * Related: app/api/sessions/[sessionId]/route.ts returns ONE session with its exchanges.
 * Firestore credentials are set up in lib/firebase.ts.
 */

// What the frontend sends. staffText/clientText are the staff-language and client-language
// versions of a line, NOT who spoke; "speaker" says who actually said it.
type ExchangeShape = {
    speaker: 'staff' | 'client'
    staffText: string
    clientText: string
}

type SessionBodyShape = {
    sessionId: string
    staffLanguage: string
    clientLanguage: string
    label?: string
    exchanges: ExchangeShape[]
}

// gRPC status code Firestore returns when create() targets a document that already exists
const FIRESTORE_ALREADY_EXISTS_CODE = 6

// Thrown internally so POST can tell "already saved" (409) from other Firestore errors (502)
class SessionAlreadyExistsError extends Error {}

function isAlreadyExistsError(error: unknown) {
    if (typeof error !== 'object' || error === null) {
        return false
    }
    const errorWithCode = error as { code?: number }
    return errorWithCode.code === FIRESTORE_ALREADY_EXISTS_CODE
}

/**
 * GET /api/sessions: retrieves the saved conversation sessions.
 *
 * Response: 200 { sessionList: Session[] }, ordered by creation time (newest first).
 * Each session includes its sessionId and metadata, but not its exchanges.
 * Errors are JSON { error } with:
 *   502  Firestore read failed
 * 
 * TODO: no pagination (every session is returned each time) and no authentication, so anyone
 * with the URL can read all saved conversations. Add both before real use.
 * NOTE: sessions saved without a createdAt would be left out by the orderBy below.
 */
export async function GET() {
    try {
        const snapshot = await db.collection('sessions').orderBy('createdAt', 'desc').get()
        const sessionList = []

        // Loop through each conversation (session) and get their data excluding subcollection of the conversation (chat specifics)
        for (const doc of snapshot.docs) {
            const sessionData = doc.data()

            const session = {
                sessionId: doc.id,
                ...sessionData,
                // Firestore timestamps are objects that React can't render, 
                // so convert to ISO string. The frontend formats it for display.
                createdAt: sessionData.createdAt?.toDate().toISOString() ?? null,
            }

            sessionList.push(session)
        }
        return NextResponse.json({ sessionList }, { status: 200 })
    } catch (error) {
        console.error('Firestore read failed:', error)
        return NextResponse.json({ error: 'Failed to retrieve sessions' }, { status: 502 })
    }
}

/**
 * POST /api/sessions: saves a conversation session and its exchanges.
 *
 * Request body (JSON):
 *   {
 *     sessionId: string,
 *     staffLanguage: string,
 *     clientLanguage: string,
 *     label?: string,
 *     exchanges: { speaker: 'staff' | 'client', staffText: string, clientText: string }[]
 *   }
 *
 * Response: 200 { success: true, sessionId: string }.
 * Errors are JSON { error } with:
 *   400  invalid JSON or missing required fields
 *   409  sessionId has already been saved
 *   502  Firestore write failed after 3 attempts
 *
 * NOTE: every exchange needs non-empty staffText and clientText. A message that is still
 * loading or failed has null text on the frontend, so saving at that moment is rejected with 400.
 * NOTE: a Firestore batch holds at most 500 writes (1 for the session plus 1 per exchange),
 * so a conversation of about 500 messages or more can't be saved.
 */
export async function POST(req: NextRequest) {
    let body: SessionBodyShape

    try {
        body = await req.json()
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { sessionId, staffLanguage, clientLanguage, label, exchanges } = body

    if (!sessionId || !staffLanguage || !clientLanguage || !Array.isArray(exchanges) || exchanges.length === 0) {
        return NextResponse.json({ error: 'Missing sessionId, staffLanguage, clientLanguage, or exchanges' }, { status: 400 })
    }

    for (const exchange of exchanges) {
        if (!exchange.speaker || !exchange.staffText || !exchange.clientText) {
            return NextResponse.json({ error: 'Each exchange requires speaker, staffText, and clientText' }, { status: 400 })
        }
    }

    try {
        await saveSessionWithRetry(sessionId, staffLanguage, clientLanguage, label, exchanges)
        return NextResponse.json({ success: true, sessionId }, { status: 200 })
    } catch (error) {
        if (error instanceof SessionAlreadyExistsError) {
            return NextResponse.json({ error: 'Session already saved' }, { status: 409 })
        }
        console.error('Firestore write failed after retries:', error)
        return NextResponse.json({ error: 'Failed to save session' }, { status: 502 })
    }
}

/**
 * Writes the session and all its exchanges in one atomic batch, retrying on failure.
 * Atomic means either everything is saved or nothing is, so a failed attempt can't leave
 * half a conversation behind.
 *
 * Retries up to 3 times (with no delay between attempts) to ride out brief Firestore or network
 * errors. An "already exists" error is never retried, because it would fail every time.
 *
 * @param sessionId Document ID for the session (made by the frontend)
 * @param label Optional display name; the History page shows "Untitled Session" if it's missing
 * @param exchanges Messages in conversation order. Their position becomes the "order" field.
 * @throws SessionAlreadyExistsError if this sessionId was saved before; otherwise the last Firestore error
 */
async function saveSessionWithRetry(sessionId: string, staffLanguage: string, clientLanguage: string, label: string | undefined, exchanges: ExchangeShape[]) {
    const MAX_ATTEMPTS = 3
    let lastError

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const batch = db.batch()
            const sessionReference = db.collection('sessions').doc(sessionId)

            // Define the object for the chat session
            // create() fails with ALREADY_EXISTS if this session was saved before
            batch.create(sessionReference, {
                staffLanguage,
                clientLanguage,
                label: label ?? null, // Firestore doesn't allow undefined, so convert to null
                createdAt: FieldValue.serverTimestamp(),
            })

            // Loop through and create subcollections for each time someone speaks
            for (let i = 0; i < exchanges.length; i++) {
                const exchange = exchanges[i]
                // Gets the subcollection of sessions
                const exchangeRef = sessionReference.collection('exchanges').doc()

                // Set them with an order number for easy retrieval later
                batch.set(exchangeRef, {
                    speaker: exchange.speaker,
                    staffText: exchange.staffText,
                    clientText: exchange.clientText,
                    order: i,
                })
            }

            // Commit change and exit function
            await batch.commit()
            return
        } catch (error) {
            // A duplicate will never succeed on retry, so surface it immediately
            if (isAlreadyExistsError(error)) {
                throw new SessionAlreadyExistsError()
            }
            lastError = error
            console.warn(`Firestore write attempt ${attempt} failed, retrying...`)
        }
    }

    // All attempts exhausted
    throw lastError
}
