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
    "audioBase64": "string (required) — base64-encoded audio, recorded via MediaRecorder",
    "languageCode": "string (required) — BCP-47 code, e.g. 'en-US'"
}
```

### Responses

- `200` — `{ "transcript": "..." }` (transcript will be `""` if the API returns no recognizable speech)
- `400` — missing audio or language code, e.g. `{ "error": "Missing audioBase64 or languageCode" }`, or invalid JSON body: `{ "error": "Invalid JSON body" }`
- `502` — Google Speech API call failed, `{ "error": "Speech-to-text failed" }`

### Notes

- Only supports `WEBM_OPUS` audio (Chrome/Firefox/Edge default). Won't work with Safari/iPad audio yet — flag with backend before wiring up iPad recording.
- A `200` with an empty `""` transcript means no speech was detected — not an error, handle separately from `502`.
