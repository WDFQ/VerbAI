import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'

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

const FIRESTORE_ALREADY_EXISTS_CODE = 6

class SessionAlreadyExistsError extends Error {}

function isAlreadyExistsError(error: unknown) {
    if (typeof error !== 'object' || error === null) {
        return false
    }
    const errorWithCode = error as { code?: number }
    return errorWithCode.code === FIRESTORE_ALREADY_EXISTS_CODE
}

/**
 * gets the entire
 */
export async function GET() {
    try {
        const snapshot = await db.collection('sessions').orderBy('createdAt', 'desc').get()
        const sessionList = []

        // loop through each conversation (session) and get their data excluding subcollection of the conversation (chat specifics)
        for (const doc of snapshot.docs) {
            const sessionData = doc.data()

            const session = {
                sessionId: doc.id,
                ...sessionData,
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

async function saveSessionWithRetry(sessionId: string, staffLanguage: string, clientLanguage: string, label: string | undefined, exchanges: ExchangeShape[]) {
    const MAX_ATTEMPTS = 3
    let lastError

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const batch = db.batch()
            const sessionReference = db.collection('sessions').doc(sessionId)

            // e.g. 2026-09-03 — en/prs
            // const sessionLabel =`${new Date().toISOString().split('T')[0]} — ${staffLanguage}/${clientLanguage}`

            // define the object for the chat session
            // create() fails with ALREADY_EXISTS if this session was saved before
            batch.create(sessionReference, {
                staffLanguage,
                clientLanguage,
                label: label,
                createdAt: FieldValue.serverTimestamp(),
            })

            // loop through and create subcollections for each time someone speaks
            for (let i = 0; i < exchanges.length; i++) {
                const exchange = exchanges[i]
                // gets the subcollection of sessions
                const exchangeRef = sessionReference.collection('exchanges').doc()

                // set them with an order number for easy retrieval later
                batch.set(exchangeRef, {
                    speaker: exchange.speaker,
                    staffText: exchange.staffText,
                    clientText: exchange.clientText,
                    order: i,
                })
            }

            // commit change and exit function
            await batch.commit()
            return
        } catch (error) {
            // a duplicate will never succeed on retry, so surface it immediately
            if (isAlreadyExistsError(error)) {
                throw new SessionAlreadyExistsError()
            }
            lastError = error
            console.warn(`Firestore write attempt ${attempt} failed, retrying...`)
        }
    }

    // all attempts exhausted
    throw lastError
}
