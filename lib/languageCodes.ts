// Maps the app's display language names to BCP-47 tags for the Speech-to-Text API
const BCP47_BY_LANGUAGE: Record<string, string> = {
    English: "en-US",
    Dari: "prs-AF",
    Swahili: "sw-TZ",
    Kinyarwanda: "rw-RW",
    Tagalog: "fil-PH",
    Urdu: "ur-PK",
};

export function toBcp47(language: string | null): string | null {
    if (!language) return null;
    return BCP47_BY_LANGUAGE[language] ?? null;
}
