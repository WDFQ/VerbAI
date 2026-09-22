export type TranscriptMessage = {
    id: string;
    role: "staff" | "client";
    originalText: string | null;
    translatedText: string | null;
    hasError: boolean;
    timestamp: string;
};