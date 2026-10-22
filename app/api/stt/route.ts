import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/stt: turns a recorded audio clip into text (speech-to-text).
 *
 * Request body (JSON):  { audioBase64: string, languageCode: string }
 *   - audioBase64:  the recording, base64-encoded (made by blobToBase64 in hooks/useAudioRecorder)
 *   - languageCode: BCP-47 code of the SPEAKER's language, from lib/languageCodes.ts (e.g. "sw-TZ")
 *
 * Response: 200 { transcript: string }. The transcript is an empty string when no
 * speech was detected, and the frontend treats that as "No speech detected".
 * Errors are JSON { error } with:
 *   400  missing fields or unreadable body
 *   502  Google Speech-to-Text failed
 *
 * Calls Google Cloud Speech-to-Text (REST "recognize" endpoint, API key auth).
 *
 * Environment variables:
 *   SPEECH_API_KEY   Google Cloud API key (the Speech-to-Text API must be enabled on the project)
 *
 * Known limits:
 *   - The audio format is fixed as WEBM_OPUS, which Chrome on desktop and Android records,
 *     and it was tested working on iPad Safari (iPadOS version: 27).
 *     Older Safari versions recorded MP4/AAC instead, which Google would reject,
 *     so check the browser version if transcription fails on an Apple device.
 *   - "recognize" is Google's synchronous endpoint, which only accepts short clips
 *     (about a minute). Longer recordings would need a different endpoint.
 */
export async function POST(req: NextRequest) {
    try {
        const { audioBase64, languageCode } = await req.json()

        if (!audioBase64 || !languageCode) {
            return NextResponse.json({ error: 'Missing audioBase64 or languageCode' }, { status: 400 })
        }

        // Fail early with a clear error if the key isn't configured (e.g. a missing
        // environment variable on a new deployment), instead of sending "key=undefined" to Google
        if (!process.env.SPEECH_API_KEY) {
            console.error('Missing Google Cloud Speech API key');
            return NextResponse.json({ error: 'Speech API configuration is missing' }, { status: 500 });
        }

        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${process.env.SPEECH_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                config: {
                    // Must match the format of the recording made by blobToBase64 in hooks/useAudioRecorder
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 48000,
                    // Tells Google which language to listen for. Unsupported codes fail.
                    languageCode: languageCode,
                },
                audio: {
                    content: audioBase64,
                },
            }),
        })

        if (!response.ok) {
            // Log Google's real error for debugging, but send the client a generic message
            const errorText = await response.text()
            console.error('Speech API error:', errorText)

            return NextResponse.json({ error: 'Speech-to-text failed' }, { status: 502 })
        }

        const data = await response.json()

        // Google returns a list of results, each with ranked alternatives.
        // We take the best alternative (index 0) of the first result.
        // No results at all means no speech was detected, so we return ''.
        // TODO: only the first result is used, but if the recording has multiple speakers or long pauses,
        // there may be multiple results. We could combine them into one transcript.
        const transcript = data.results?.[0]?.alternatives?.[0]?.transcript ?? ''

        return NextResponse.json({ transcript }, { status: 200 })
    } catch (error) {
        // TODO: this catches EVERY error, including network failures calling Google,
        // but always replies "Invalid JSON body" with a 400. The real cause is only
        // visible in the server log below.
        console.error('Invalid request body:', error)

        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
}
