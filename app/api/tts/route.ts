import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LANGUAGE_CODE = "en-NZ";

// Google Cloud TTS has no Persian/Dari voice, so these languages are sent to ElevenLabs.
// "prs" is Dari (Afghan Persian), "fa" is Persian, "pes" is Iranian Persian.
const ELEVENLABS_LANGUAGE_SUBTAGS = ["fa", "prs", "pes"];

interface SynthesisResult {
    audioBuffer: Buffer<ArrayBuffer> | null;
    errorResponse: NextResponse | null;
}

function shouldUseElevenLabs(languageCode: string): boolean {
    const primarySubtag = languageCode.split("-")[0].toLowerCase();
    return ELEVENLABS_LANGUAGE_SUBTAGS.includes(primarySubtag);
}

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

    return {
        audioBuffer: Buffer.from(data.audioContent, "base64"),
        errorResponse: null,
    };
}

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
        console.error("TTS error:", error);

        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }
}
