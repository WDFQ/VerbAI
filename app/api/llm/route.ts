// app/api/llm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest, res: NextResponse) {
    let sttText
    let targetLanguage

    try {
        // get speech to text text
        const body = await req.json()
        sttText = body.sttText
        targetLanguage = body.targetLanguage

        // if any of them is empty return 400 error
        if (!sttText || !targetLanguage) {
            return NextResponse.json({ error: 'Missing sttText or targetLanguage' }, { status: 400 })
        }

        try {
            // get translation
            const translatedText = await translate(sttText, targetLanguage)
            return NextResponse.json({ translatedText }, { status: 200 })
        } catch (error) {
            // return 502 for external error thats not related to this api
            console.error('Gemini translation error:', error)
            return NextResponse.json({ error: 'Translation failed' }, { status: 502 })
        }
    } catch (error) {
        // catch any error for invalid request
        console.error('Invalid request body:', error)
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
}

/**
 * translates inputted text into the target language
 * @param sttText is inputted text for translation
 * @param targetLanguage is the target language to translate to
 * @returns the translated language as string
 */
async function translate(sttText: String, targetLanguage: String) {
    const ai = new GoogleGenAI({})
    const interaction = await ai.interactions.create({
        model: 'gemini-3.7-flash',
        input: `Translate the following into ${targetLanguage}. Only return the translated text:\n\n${sttText}`,
    })

    return interaction.output_text
}
