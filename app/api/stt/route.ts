import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

    try {
        const { audioBase64, languageCode } = await req.json();

        if (!audioBase64 || !languageCode) {
            return NextResponse.json(
                { error: "Missing audioBase64 or languageCode" },
                { status: 400 }
            );
        }
        const response = await fetch(
            `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.SPEECH_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    config: {
                        encoding: "WEBM_OPUS",
                        sampleRateHertz: 48000,
                        languageCode: languageCode,
                    },
                    audio: {
                        content: audioBase64,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Speech API error:", errorText);

            return NextResponse.json(
                { error: "Speech-to-text failed" },
                { status: 502 }
            );
        }

        const data = await response.json();

        const transcript =
            data.results?.[0]?.alternatives?.[0]?.transcript ?? "";

        return NextResponse.json(
            { transcript },
            { status: 200 }
        );
    } catch (error) {
        console.error("Invalid request body:", error);

        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }
}