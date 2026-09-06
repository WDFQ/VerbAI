import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.SPEECH_API_KEY;

if (!apiKey) {
  throw new Error("SPEECH_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

function createWavBuffer(
  pcmData: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
) {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([header, pcmData]);
}

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
        
        const interaction = await ai.interactions.create({
            model: "gemini-3.1-flash-tts-preview",
            input: `Speak the following text in the language identified by the BCP-47 code ${languageCode}. Return only the spoken text.
            ${text}`,
            response_format: {
                type: "audio",
            },
            
            generation_config: {
                speech_config: [
                    {
                        voice: "Kore",
                    },
                ],
            },
        });
        
        const audioData = interaction.output_audio?.data;
        
        if (!audioData) {
            return NextResponse.json(
                { error: "No audio was generated" },
                { status: 500 }
            );
        }
        
        const pcmBuffer = Buffer.from(audioData, "base64");
        const wavBuffer = createWavBuffer(pcmBuffer);
        
        return new NextResponse(wavBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": wavBuffer.length.toString(),
                "Cache-Control": "no-store",
                "X-Language-Code": languageCode,
            },

        });
    } catch (error) {
        console.error("TTS error:", error);
        return NextResponse.json(
            
            { error: "Text-to-speech conversion failed" },
            { status: 500 }
        );
    }
}