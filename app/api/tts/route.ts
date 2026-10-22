import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tts: turns text into spoken audio.
 * 
 * Request body (JSON): { text: string, languageCode?: string }
 * - text: what to speak (the frontend sends the translated message)
 * - languageCode: BCP-47 language code from lib/languageCodes.ts (e.g. "en-NZ", "prs-AF"). If not provided, defaults to DEFAULT_LANGUAGE_CODE.
 * 
 * Response: 200 with an MP3 file (audio/mpeg), or JSON error message with:
 * - 400: missing text or unreadable body
 * - 500: an API key / config value is missing on the server
 * - 502: the TTS service failed to generate audio
 * 
 * Provider routing: Persian/Dari goes to ElevenLabs, everything else goes to Google Cloud TTS. 
 * The provider is chosen based on the primary language subtag (the part before the dash in a BCP-47 code).
 * 
 * Environment variables:
 * - SPEECH_API_KEY: Google Cloud TTS API key
 * - ELEVENLABS_API_KEY: ElevenLabs API key
 * - ELEVENLABS_VOICE_ID: which ElevenLabs voice to use
 */

// Used when the request has no languageCode.
const DEFAULT_LANGUAGE_CODE = "en-NZ";

// Google Cloud TTS has no Persian/Dari voice, so these languages are sent to ElevenLabs.
// "prs" is Dari (Afghan Persian), "fa" is Persian, "pes" is Iranian Persian.
// To route another language to ElevenLabs, add its primary subtag to this array
// (the part before the dash in a BCP-47 code like "prs" in "prs-AF").
const ELEVENLABS_LANGUAGE_SUBTAGS = ["fa", "prs", "pes"];

// Each provider funcion returns either audio or ready-made error response,
// so the handler below doesn't need to know which provider ran.
interface SynthesisResult {
    audioBuffer: Buffer<ArrayBuffer> | null;
    errorResponse: NextResponse | null;
}

// Compares only the part before the "-" so "prs-AF" and "prs" both match
function shouldUseElevenLabs(languageCode: string): boolean {
    const primarySubtag = languageCode.split("-")[0].toLowerCase();
    return ELEVENLABS_LANGUAGE_SUBTAGS.includes(primarySubtag);
}

/**
 * Generates speech with Google Cloud TTS (REST API, authenticated by an API key).
 * @param text The text to speak
 * @param languageCode BCP-47 code. Google picks a default voice for that language
 * @returns The MP3 audio, or an error response (500 missing key, 502 Google failed) if the request failed
 * 
 * NOTE: not every language has a voice. A code Google doesn't support will return a 502 error with a message like "The requested voice is not available for the specified language code."
 */
async function synthesizeWithGoogle(text: string, languageCode: string): Promise<SynthesisResult> {
    const apiKey = process.env.SPEECH_API_KEY;

    if (!apiKey) {
        console.error("Missing Google Speech API key");

        return {
            audioBuffer: null,
            errorResponse: NextResponse.json(
                { error: "Google Text-to-Speech configuration is missing" },
                { status: 500 }
            ),
        };
    }

    const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                input: {
                    text,
                },
                voice: {
                    languageCode,
                },
                audioConfig: {
                    audioEncoding: "MP3",
                },
            }),
        }
    );

    if (!response.ok) {
        // Log Google's real error for debugging, but send the client a generic message
        const errorText = await response.text();
        console.error("Google Text-to-Speech API error:", errorText);

        return {
            audioBuffer: null,
            errorResponse: NextResponse.json(
                { error: "Text-to-speech failed" },
                { status: 502 }
            ),
        };
    }

    const data = await response.json();

    if (!data.audioContent) {
        return {
            audioBuffer: null,
            errorResponse: NextResponse.json(
                { error: "No audio was generated" },
                { status: 502 }
            ),
        };
    }

    // Google returns the audio as a base64 string, so decode it into raw bytes
    return {
        audioBuffer: Buffer.from(data.audioContent, "base64"),
        errorResponse: null,
    };
}

/**
 * Generates speech with ElevenLabs. Used for Dari/Persian.
 * @param text The text to speak
 * @returns The MP3 audio, or an error message (500 missing config, 502 ElevenLabs failed)
 * 
 * NOTE: no language is sent. ElevenLabs works out the language from the text and the voice
 * (ELEVENLABS_VOICE_ID), so voice choice affects accent and quality. A voice trained on
 * Iranian Persian will sound Iranian rather than Afghan.
 * 
 * TODO: model_id is "eleven_multilingual_v2". ElevenLabs' docs list Persian and
 * Swahili under "eleven_v3", not Multilingual v2. If Dari audio sounds wrong or
 * fails, check this first.
 * ElevenLabs charges per character, so replaying audio uses up the quota.
 */
async function synthesizeWithElevenLabs(text: string): Promise<SynthesisResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
        console.error("Missing ElevenLabs environment variables");

        return {
            audioBuffer: null,
            errorResponse: NextResponse.json(
                { error: "ElevenLabs configuration is missing" },
                { status: 500 }
            ),
        };
    }

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs TTS error:", errorText);

        return {
            audioBuffer: null,
            errorResponse: NextResponse.json(
                { error: "Text-to-speech failed" },
                { status: 502 }
            ),
        };
    }

    return {
        audioBuffer: Buffer.from(await response.arrayBuffer()),
        errorResponse: null,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const text = body.text;
        let languageCode = DEFAULT_LANGUAGE_CODE;

        if (typeof body.languageCode === "string" && body.languageCode.length > 0) {
            languageCode = body.languageCode;
        }

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "No text provided" },
                { status: 400 }
            );
        }

        // Pick the provider from the language code
        let result: SynthesisResult;

        if (shouldUseElevenLabs(languageCode)) {
            result = await synthesizeWithElevenLabs(text);
        } else {
            result = await synthesizeWithGoogle(text, languageCode);
        }

        if (result.errorResponse) {
            return result.errorResponse;
        }

        if (!result.audioBuffer) {
            return NextResponse.json(
                { error: "No audio was generated" },
                { status: 502 }
            );
        }

        // Both provider return MP3, so the frontend can play the result the same way.
        // no-store stops the browser from caching the audio, which is important for privacy in a medical setting.
        return new NextResponse(result.audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": result.audioBuffer.length.toString(),
                "Cache-Control": "no-store",
                "X-Language-Code": languageCode,
            },
        });
    } catch (error) {
        // TODO: this catches EVERY error, including unexpected failures such as
        // network errors calling a provider, but always replies "Invalid JSON body"
        // with a 400. The real cause is only visible in the server log below.
        console.error("TTS error:", error);

        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }
}
