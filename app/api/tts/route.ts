import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const text = body.text;
        const languageCode = body.languageCode || "en-NZ";

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "No text provided" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.SPEECH_API_KEY}`,
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
            console.error("Text-to-Speech API error:", errorText);

            return NextResponse.json(
                { error: "Text-to-speech failed" },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data.audioContent) {
            return NextResponse.json(
                { error: "No audio was generated" },
                { status: 502 }
            );
        }

        const audioBuffer = Buffer.from(data.audioContent, "base64");

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.length.toString(),
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