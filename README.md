# VerbAI

VerbAI is a real-time, two-way speech translation app built for face-to-face conversations between a staff member and a client who don't share a language. Each side picks their spoken language, taps a mic button to talk, and VerbAI transcribes, translates, and reads back the translation on the other side — with the full exchange saved as a session for later reference.

Built with Next.js (App Router), Google Gemini (speech-to-text, translation, and text-to-speech), and Firebase Firestore.

## Features

- **Two-way conversation UI** — separate staff/client panels, each with its own language selection and mic control, so only one side records at a time.
- **Speech-to-text** — spoken audio is transcribed via Gemini.
- **Translation** — transcripts are translated into the other party's language via Gemini Flash.
- **Text-to-speech** — translated text can be read aloud via Google Cloud Text-to-Speech (ElevenLabs for Persian/Dari).
- **Session history** — completed conversations are saved to Firestore, with each exchange recorded in order.

Supported languages: English, Dari, Swahili, Kinyarwanda (see `lib/languageCodes.ts`).

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) + shadcn/ui components
- [Google Gemini API](https://ai.google.dev) (`@google/genai`) for STT, translation, and TTS
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) for Firestore session storage

## Getting Started

### Prerequisites

- Node.js
- A Google Gemini API key
- A Firebase project with a service account (Firestore enabled)

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
    | `LLM_API_KEY` | Gemini API key used for translation |
    | `SPEECH_API_KEY` | Gemini API key used for speech-to-text and text-to-speech |
    | `FIREBASE_PROJECT_ID` | Firebase project ID |
    | `FIREBASE_CLIENT_EMAIL` | Firebase service account client email |
    | `FIREBASE_PRIVATE_KEY` | Firebase service account private key |

3. Run the development server:

    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
