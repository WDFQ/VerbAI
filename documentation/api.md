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

Converts recorded audio into text using Google Cloud Speech-to-Text.

### Request Body

```json
{
    "audioBase64": "string (required) — base64-encoded audio recorded via MediaRecorder",
    "languageCode": "string (required) — BCP-47 language code, e.g. 'en-NZ'"
}
```

### Responses

- `200` — `{ "transcript" }`
- `400` — missing audio, `{ "error": "Missing audioBase64 or languageCode" }, or invalid JSON body: { "error": "Invalid JSON body" }`
- `502` — Google Speech-to-Text API call failed, `{ "error": "Speech-to-text failed" }`

### Notes

- Audio is sent to Google Cloud Speech-to-Text using the Google Speech REST API.
- The endpoint expects WEBM_OPUS audio from the browser recorder.
- The audio is configured with a sample rate of 48000 Hz.
languageCode identifies the spoken language using a BCP-47 language code.
- The endpoint is called by the frontend through the server-side API route.
- A successful response may contain an empty transcript if no recognizable speech is returned.

---

## POST /api/tts

Converts text into speech using Google Cloud Text-to-Speech.

### Request Body

```json
{
    "text": "string (required) — text to convert to speech",
    "languageCode": "string (optional) — BCP-47 language code, defaults to 'en-NZ'"
}
```

### Responses

- 200 — MP3 audio containing the generated speech.
- 400 — missing or invalid text, `{ "error": "No text provided" }`, or invalid JSON body: `{ "error": "Invalid JSON body" }`
- 502 — Google Text-to-Speech API call failed, `{ "error": "Text-to-speech failed" }`

### Notes

- Text is sent to Google Cloud Text-to-Speech using the Google Text-to-Speech REST API.
- The requested languageCode is passed to the Google TTS API.
- The generated audio is returned as MP3.
- The response has Content-Type: audio/mpeg.
- The X-Language-Code response header contains the requested language code.
- The endpoint is called by the frontend through the server-side API route.