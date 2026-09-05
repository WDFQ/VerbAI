export type TranscriptMessage = {
    id: string;
    role: "staff" | "client";
    originalText: string;
    translatedText: string;
    timestamp: string;
};