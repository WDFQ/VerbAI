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
        const formData = await request.formData();
        
        const audio = formData.get("audio");
        const languageCode =
        
        formData.get("languageCode")?.toString() || "en-NZ";
        
        if (!(audio instanceof File)) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }
        const audioBuffer = Buffer.from(await audio.arrayBuffer());
        const base64Audio = audioBuffer.toString("base64");
        
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
                    mime_type: audio.type || "audio/webm",
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