import { NextRequest, NextResponse } from "next/server";
// pages/api/stt.js  (or app/api/stt/route.js)

export default async function handler(req: NextRequest, res: NextResponse) {
  const { audioBase64, languageCode } = await req.json();

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_STT_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS", // match what the browser's MediaRecorder produces
          sampleRateHertz: 48000,
          languageCode: languageCode || "en-US",
        },
        audio: { content: audioBase64 },
      }),
    },
  );

  const data = await response.json();
  const transcript = data.results?.[0]?.alternatives?.[0]?.transcript ?? "";

  res.status(200).json({ transcript });
}
