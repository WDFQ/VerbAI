// app/api/llm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest, res: NextResponse) {
    // get speech to text text
    const body = await req.json()
    const sttText = body.sttText

    // translate text using gemini
    // send response back from llm
}

async function translate(sttText: String) {
    const ai = new GoogleGenAI({})
    const interaction = await ai.interactions.create({
        model: 'gemini-3.7-flash',
        input: 'Explain how AI works in a few words',
    })
}
