/**
 * One message in the conversation, shared by the main screen (app/page.tsx) and the transcript
 * (components/transcriptArea.tsx).
 *
 * A message is created as soon as a recording stops, before any text exists, and is filled in
 * as each step finishes. What the UI shows depends on which fields are set:
 *
 *   originalText   translatedText   hasError   shown as
 *   null           null             false      loading spinner (transcribing)
 *   null           null             true       retry button (transcription failed)
 *   string         null             false      loading spinner (translating)
 *   string         null             true       retry button (translation failed)
 *   string         string           false      the finished message
 *
 * Only these combinations are meant to occur. hasError is cleared whenever a retry starts.
 *
 * NOTE: saving to Firestore needs both texts, so a message still loading or failed can't be
 * saved (the API rejects it with a 400). See app/api/sessions/route.ts.
 */
export type TranscriptMessage = {
    id: string; // unique ID made with crypto.randomUUID() on the frontend, used as the Firestore document ID
    role: "staff" | "client"; // who spoke. Decides which side of the transcript the message appears on
    originalText: string | null; // the text in the speaker's language, or null if still loading or failed
    translatedText: string | null; // the translated text, or null if still loading or failed
    hasError: boolean; // true if the message failed to load or translate, which shows the retry button
    timestamp: string; // when the message was created
};