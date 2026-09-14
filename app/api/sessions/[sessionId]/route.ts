import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

export async function GET({ params }: { req: NextRequest; params: { sessionId: string } }) {
    const { sessionId } = params

    try {
        const sessionDoc = await db.collection('sessions').doc(sessionId).get()

        if (!sessionDoc.exists) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // gets the array of exchanges (each object contains speaker, staffText, clientText, Order)
        const exchanges = (await db.collection('sessions').doc(sessionId).collection('exchanges').orderBy('order').get()).docs.map((doc) => doc.data())

        // combine sessionId, session info, and exchanges together into one json obj
        return NextResponse.json({ sessionId, ...sessionDoc.data(), exchanges }, { status: 200 })
    } catch (error) {
        console.error('Firestore read failed:', error)
        return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 502 })
    }
}
