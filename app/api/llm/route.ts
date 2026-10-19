// app/api/llm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
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
    const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY })
    
    const languageInstruction =
    targetLanguage === "Dari"
        ? "spoken Dari as everyday people in Afghanistan would say it in conversation (Afghan Persian, not Iranian Persian). Use natural, informal-but-polite spoken phrasing, not formal or literary written style. Keep sentences short and simple."
        : targetLanguage

    const interaction = await ai.interactions.create({
        model: 'gemini-3.7-flash',
        input: `Interpret this live speech from a social-services appointment into ${languageInstruction}. Use natural, polite spoken phrasing, not formal or word-for-word. Keep names, numbers and dates exact. Output only JSON: {"translation":"..."}\n\nText: ${sttText}`    
    })

    //Ensure that the output text exists in the response
    if (!interaction.output_text) {
        console.error("No output_text in response:", JSON.stringify(interaction, null, 2));
        throw new Error("Translation response did not contain output text");
    }
     const raw = interaction.output_text

    // 2. Grab everything from the first { to the last }, ignoring fences or stray text
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')

    if (start === -1 || end === -1) {
        console.error('No JSON object found in response:', raw)
        throw new Error('Translation response did not contain JSON')
    }

    // 3. Parse and return just the translation
    try {
        const jsonResponse = JSON.parse(raw.slice(start, end + 1))
        return jsonResponse.translation
    } catch (error) {
        console.error('Error parsing translation response:', error, raw)
        throw new Error('Failed to parse translation response')
    }
}
