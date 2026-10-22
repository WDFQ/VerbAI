// app/api/llm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

/**
 * POST /api/llm: translates a speech-to-text transcript into the target language.
 *
 * Request body (JSON): { sttText: string, targetLanguage: string }
 * Response: 200 { translatedText: string }.
 * Errors are JSON { error } with:
 *   400  invalid JSON or missing sttText/targetLanguage
 *   502  translation request or response parsing failed
 *
 * Uses the Gemini API and requests a natural, polite spoken translation.
 * Dari translations are specifically requested in everyday Afghan Persian.
 * 
 * Environment variables:
 *   LLM_API_KEY   Google AI (Gemini) API key
 *
 * Known limits:
 *   - Free-tier Gemini models have low daily request caps, which limited our testing.
 *     The model below was picked partly because of its quota, so check the limits before
 *     changing it or moving to production.
 *   - Translations have NOT been reviewed by native speakers (see the README).
 */
export async function POST(req: NextRequest) {
    let sttText
    let targetLanguage

    try {
        // Get speech to text text
        const body = await req.json()
        sttText = body.sttText
        targetLanguage = body.targetLanguage

        // If any of them is empty return 400 error
        if (!sttText || !targetLanguage) {
            return NextResponse.json({ error: 'Missing sttText or targetLanguage' }, { status: 400 })
        }

        // Fail early with a clear error if the key isn't configured (e.g. a missing
        // environment variable on a new deployment)
        if (!process.env.LLM_API_KEY) {
            console.error('Missing LLM_API_KEY')
            return NextResponse.json({ error: 'Translation configuration is missing' }, { status: 500 })
        }

        try {
            // Get translation
            const translatedText = await translate(sttText, targetLanguage)
            return NextResponse.json({ translatedText }, { status: 200 })
        } catch (error) {
            // Return 502 for external error thats not related to this API
            console.error('Gemini translation error:', error)
            return NextResponse.json({ error: 'Translation failed' }, { status: 502 })
        }
    } catch (error) {
        // Catch any error for invalid request
        console.error('Invalid request body:', error)
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
}

/**
 * Translates inputted text into the target language
 * @param sttText is inputted text for translation
 * @param targetLanguage is the target language to translate to
 * @returns the translated language as string
 * 
 * TODO: LLM_API_KEY is not checked. If it's missing, the call fails and the client only
 * sees a generic 502 ("Translation failed"). Check the server log for the real error.
 * TODO: the "translation" field is returned without checking it's a non-empty string.
 * If the model leaves it out, the frontend receives undefined and may show a blank bubble.
 */
async function translate(sttText: String, targetLanguage: String) {
    const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY })
    
    // Extra guidance for languages where the model's default output sounded wrong.
    // Dari: without this the model tends to produce Iranian Persian in a formal written style,
    // which was correct but sounded stiff and unnatural when read aloud.
    // To tune another language, add a similar branch here (only Dari has one so far).
    const languageInstruction =
    targetLanguage === "Dari"
        ? "spoken Dari as everyday people in Afghanistan would say it in conversation (Afghan Persian, not Iranian Persian). Use natural, informal-but-polite spoken phrasing, not formal or literary written style. Keep sentences short and simple."
        : targetLanguage

    // The prompt sets the scene (a live social-services appointment), asks for spoken rather than
    // word-for-word phrasing, and says names, numbers and dates must stay exact, since a changed
    // date or name in a visa or legal appointment would be a serious error.
    // JSON output is requested so the translation can be pulled out reliably (see parsing below).
    // NOTE: sttText is inserted straight into the prompt, so a speaker could say something that
    // reads as an instruction to the model. Treat the output as untrusted text.
    // NOTE: ai.interactions.create and its response fields (output_text) come from the current
    // @google/genai SDK. If you upgrade the SDK, re-check them and test a translation.
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
    // (The model often wraps its JSON in a ```json code fence, which breaks JSON.parse,
    // and may add extra text before or after it.)
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
