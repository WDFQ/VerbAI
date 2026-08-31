import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { audioBase64, languageCode } = await req.json()

        // if missing audio return a 400
        if (!audioBase64) {
            return NextResponse.json({ error: 'Missing audioBase64' }, { status: 400 })
        }

        // call audio api
        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${process.env.SPEECH_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 48000,
                    languageCode: languageCode || 'en-US',
                },
                audio: { content: audioBase64 },
            }),
        })

        // if returned error
        if (!response.ok) {
            const errText = await response.text()
            console.error('Speech API error:', errText)
            return NextResponse.json({ error: 'Speech-to-text failed' }, { status: 502 })
        }

        const data = await response.json()
        const transcript = data.results?.[0]?.alternatives?.[0]?.transcript ?? ''

        return NextResponse.json({ transcript }, { status: 200 })
    } catch (error) {
        console.error('Invalid request body:', error)
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
}
