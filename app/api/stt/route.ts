import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.SPEECH_API_KEY;

if (!apiKey) {
    throw new Error("SPEECH_API_KEY is not configured");
}

const ai = new GoogleGenAI({
    apiKey,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const audioBase64 = body.audioBase64;
        const languageCode = body.languageCode || "en-NZ";

        if (!audioBase64) {
            return NextResponse.json(
                { error: "No audio provided" },
                { status: 400 }
            );
        }

        // Remove data URL prefix if the frontend includes one
        const base64Audio = audioBase64.includes(",")
            ? audioBase64.split(",")[1]
            : audioBase64;

        const interaction = await ai.interactions.create({
            model: "gemini-3.7-flash",
            input: [
                {
                    type: "text",
                    text: `Generate an accurate transcript of the speech in this audio.
The spoken language is ${languageCode}.
Return only the transcript. Do not add explanations or commentary.`,
                },
                {
                    type: "audio",
                    data: base64Audio,
                    mime_type: "audio/webm",
                },
            ],
        });

        const transcript = interaction.output_text?.trim();

        if (!transcript) {
            return NextResponse.json(
                { error: "No speech could be transcribed" },
                { status: 422 }
            );
        }

        return NextResponse.json({
            transcript,
            languageCode,
        });
    } catch (error) {
        console.error("STT error:", error);

        return NextResponse.json(
            { error: "Speech-to-text conversion failed" },
            { status: 500 }
        );
    }
}