# VerbAI

VerbAI is a real-time, two-way speech translation app built for face-to-face conversations between a staff member and a client who don't share a language. Each side picks their spoken language, taps a mic button to talk, and VerbAI transcribes, translates, and reads back the translation on the other side — with the full exchange saved as a session for later reference.

Built with Next.js (App Router), Google Cloud Speech-to-Text and Text-to-Speech, Google Gemini for translation, ElevenLabs for Persian/Dari speech, and Firebase Firestore.

## Features

- **Two-way conversation UI** — separate staff/client panels, each with its own language selection and mic control, so only one side records at a time.
- **Speech-to-text** — spoken audio is transcribed via Google Cloud Speech-to-Text.
- **Translation** — transcripts are translated into the other party's language via Gemini Flash.
- **Text-to-speech** — translated text can be read aloud via Google Cloud Text-to-Speech, with ElevenLabs used for Persian/Dari.
- **Session history** — completed conversations are saved to Firestore, with each exchange recorded in order.

Supported languages: English, Dari, Swahili, Kinyarwanda, and Urdu (see `lib/languageCodes.ts`).

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) + shadcn/ui components
- [Google Gemini API](https://ai.google.dev) (`@google/genai`) for translation
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text) and [Text-to-Speech](https://cloud.google.com/text-to-speech) APIs
- [ElevenLabs](https://elevenlabs.io/) for Persian/Dari text-to-speech
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) for Firestore session storage

## Getting Started

### Prerequisites

- Node.js
- A Google Gemini API key
- A Google Cloud API key with Speech-to-Text and Text-to-Speech enabled
- A Firebase project with a service account (Firestore enabled)
- An ElevenLabs API key and voice ID for Persian/Dari text-to-speech

### Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Copy `.env.example` to `.env` and fill in your credentials:

    ```bash
    cp .env.example .env
    ```

    | Variable | Description |
    | --- | --- |
    | `LLM_API_KEY` | Google Gemini API key used for translation |
    | `SPEECH_API_KEY` | Google Cloud API key used for speech-to-text and Google text-to-speech |
    | `ELEVENLABS_API_KEY` | ElevenLabs API key used for Persian/Dari text-to-speech |
    | `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID used for Persian/Dari text-to-speech |
    | `FIREBASE_PROJECT_ID` | Firebase project ID |
    | `FIREBASE_CLIENT_EMAIL` | Firebase service account client email |
    | `FIREBASE_PRIVATE_KEY` | Firebase service account private key |

3. Run the development server:

    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### ElevenLabs text-to-speech

The `/api/tts` route sends Persian and Dari language codes to ElevenLabs and sends all other language codes to Google Cloud Text-to-Speech. Routing is based on the primary BCP-47 subtag: `fa`, `prs`, or `pes` uses ElevenLabs (for example, `prs-AF`); every other subtag uses Google.

To configure ElevenLabs, add `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` to your local environment file. The voice ID identifies the voice used for all requests routed to ElevenLabs. Choose and test a voice appropriate for your audience and dialect: the voice influences pronunciation and accent, and the current request does not send a separate language setting to ElevenLabs. Keep API keys server-side; do not expose them in client code or commit them to the repository.

ElevenLabs usage may consume account quota or incur charges, including when audio is replayed. Review your plan's limits and pricing before using it extensively.

### How to add a language

Language support spans the UI, speech recognition, translation, and speech playback. Complete each relevant step, then test a full conversation in both directions:

1. **Add the display name to the language picker.** In `app/page.tsx`, add the exact user-facing name to the `options` array. This name is also passed to the translation API and saved with session metadata.
2. **Map the display name to a BCP-47 code.** In `lib/languageCodes.ts`, add an entry to `BCP47_BY_LANGUAGE`. The key must exactly match the name in the picker. Choose a code appropriate for the language and target region; this code is used by speech recognition and text-to-speech.
3. **Confirm speech-to-text support.** Check that Google Cloud Speech-to-Text supports the chosen code. The code is sent to Google with the recorded audio; unsupported codes will fail transcription.
4. **Choose and verify the text-to-speech provider.** Google Cloud Text-to-Speech is the default provider and must support the chosen code. To route a language to ElevenLabs instead, add its primary BCP-47 subtag (the part before `-`, such as `prs` in `prs-AF`) to `ELEVENLABS_LANGUAGE_SUBTAGS` in `app/api/tts/route.ts`. Set an appropriate `ELEVENLABS_VOICE_ID` and test pronunciation for the language and dialect. The current configuration uses one ElevenLabs voice ID for all routed languages.
5. **Review translation quality and special instructions.** The translation API uses the display name as its target language. If the language needs a particular dialect, register, or spoken style, add appropriate guidance in `app/api/llm/route.ts` and validate the output with a fluent speaker.
6. **Test both conversation directions.** Verify microphone recording and transcription, translation to the other language, and TTS playback. Also check retry behavior and confirm unsupported or misconfigured provider settings return errors rather than silently producing incorrect speech.

The supported BCP-47 codes and provider capabilities can change, so check the current provider documentation before adding or changing a mapping. See `app/api/stt/route.ts`, `app/api/tts/route.ts`, and `app/api/llm/route.ts` for the provider-specific behavior.

**Provider coverage varies by language.** ElevenLabs can produce excellent Dari speech, but it does not support every language in the app (including Kinyarwanda). If the current TTS providers do not support a language, or their output quality is not good enough, research and evaluate another provider for that language. Check language and dialect coverage, voice quality with fluent speakers, API and BCP-47 support, pricing, and privacy requirements before integrating it. Provider routing may need to be updated so each language uses the service that produces the best supported result. This may be easier to implement through a unified TTS layer where each language is mapped to a specific provider behind an interface.

### Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # run eslint
```

## Project Structure

```
app/
  api/llm/       # POST /api/llm      — translate text
  api/stt/       # POST /api/stt      — speech-to-text
  api/tts/       # POST /api/tts      — text-to-speech
  api/sessions/  # POST /api/sessions — save a completed session to Firestore
  page.tsx       # main two-way conversation screen
  chat/          # session/chat view
components/      # app components + shadcn/ui primitives (components/ui)
hooks/           # useAudioRecorder, use-mobile
lib/             # firebase client, language code mapping, utils
types/           # shared TypeScript types
documentation/   # API reference (see documentation/api.md)
```

## API Reference

Full request/response schemas for `/api/sessions`, `/api/llm`, `/api/stt`, and `/api/tts` are documented in [`documentation/api.md`](./documentation/api.md).

## Learn More
