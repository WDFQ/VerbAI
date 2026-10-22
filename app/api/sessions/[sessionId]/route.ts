import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

/**
 * GET /api/sessions/[sessionId]: retrieves one saved conversation session.
 *
 * Response: 200 { sessionId, ...session, createdAt, exchanges }, where exchanges
 * are ordered by their saved order and createdAt is an ISO timestamp or null.
 * Errors are JSON { error } with:
 *   404  session was not found
 *   502  Firestore read failed
 *
 * Reads session metadata from the "sessions" collection and conversation turns
 * from that session's "exchanges" subcollection.
 * 
 * Used by the session detail page (app/history/[id]/page.tsx).
 * The list of sessions (without conversation text) comes from app/api/sessions/route.ts.
 *
 * TODO: no authentication, so anyone who knows or guesses a session ID can read that
 * conversation. Add access control before real use.
 */
export async function GET( req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
    // In Next.js 15 and later, params is a Promise and must be awaited before use
    const { sessionId } = await params

    try {
        const sessionDoc = await db.collection('sessions').doc(sessionId).get()

        if (!sessionDoc.exists) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Gets the array of exchanges (each object contains speaker, staffText, clientText, Order)
        // orderBy('order') returns them in the order the conversation happened
        const exchanges = (await db.collection('sessions').doc(sessionId).collection('exchanges').orderBy('order').get()).docs.map((doc) => doc.data())

        // Combine sessionId, session info, and exchanges together into one JSON object
        // createdAt is a Firestore timestamp object, which React can't render, so convert it to an
        // ISO string here (the frontend formats it for display)
        return NextResponse.json({ sessionId, ...sessionDoc.data(), createdAt: sessionDoc.data()?.createdAt?.toDate?.().toISOString() ?? null, exchanges }, { status: 200 })
    } catch (error) {
        console.error('Firestore read failed:', error)
        return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 502 })
    }
}
