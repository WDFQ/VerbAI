## POST /api/sessions

Saves a completed session and its exchanges to Firestore.

### Request Body

```json
{
    "sessionId": "string (required) — client-generated unique session ID",
    "staffLanguage": "string (required) — e.g. 'en'",
    "clientLanguage": "string (required) — e.g. 'prs'",
    "exchanges": [
        {
            "speaker": "'staff' | 'client'",
            "staffText": "string",
            "clientText": "string"
        }
    ]
}
```

### Responses

- `200` — `{ "success": true, "sessionId": "..." }`
- `400` — missing/invalid fields, e.g. `{ "error": "Missing sessionId, staffLanguage, clientLanguage, or exchanges" }`
- `502` — Firestore write failed after 3 retries, `{ "error": "Failed to save session" }`

### Notes

- `sessionId` must be generated on the frontend (e.g. `crypto.randomUUID()`) before calling this — the endpoint doesn't generate one.
- `exchanges` order matters — array position is treated as conversation order.

---

## POST /api/llm

Translates a piece of text into a target language using Gemini Flash.

### Request Body

```json
{
    "sttText": "string (required) — the text to translate, typically the transcript from /api/stt",
    "targetLanguage": "string (required) — the language to translate into, e.g. 'Dari'"
}
```

### Responses

- `200` — `{ "translatedText": "..." }`
- `400` — missing fields, e.g. `{ "error": "Missing sttText or targetLanguage" }`, or invalid JSON body: `{ "error": "Invalid JSON body" }`
- `502` — Gemini call failed, `{ "error": "Translation failed" }`

### Notes

- `targetLanguage` should be a language name (e.g. `"Dari"`), not an ISO code — it's passed straight into the translation prompt.
- Translation only — get `sttText` from `/api/stt` first if starting from audio.

---

## POST /api/stt

Converts recorded audio into text using Gemini.

### Request Body

```json
{
    "audioBase64": "string (required) — base64-encoded audio recorded via MediaRecorder",
    "languageCode": "string (optional) — BCP-47 language code, defaults to 'en-NZ'"
}
```

### Responses

- `200` — `{ "transcript": "...", "languageCode": "..." }`
- `400` — missing audio, `{ "error": "No audio provided" }`
- `422` — no recognizable speech, `{ "error": "No speech could be transcribed" }`
- `500` — Gemini speech-to-text conversion failed, `{ "error": "Speech-to-text conversion failed" }`

### Notes

- Audio is sent to Gemini as base64-encoded audio.
- The endpoint expects WebM audio from the browser recorder.
- `languageCode` identifies the spoken language.
- The endpoint is called by the frontend through the server-side API route.

---

## POST /api/tts

Converts text into speech using Gemini 3.1 Flash TTS.

### Request Body

```json
{
    "text": "string (required) — text to convert to speech",
    "languageCode": "string (optional) — BCP-47 language code, defaults to 'en-NZ'"
}
```

### Responses

- `200` — WAV audio containing the generated speech.
- `400` — missing or invalid text, `{ "error": "No text provided" }`
- `500` — TTS generation failed, `{ "error": "Text-to-speech conversion failed" }`

### Notes

- Uses the `gemini-3.1-flash-tts-preview` model.
- The generated PCM audio is converted to WAV before being returned.
- The default voice is `Kore`.
- The response has `Content-Type: audio/wav`.
- The `X-Language-Code` response header contains the requested language code.