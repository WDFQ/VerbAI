/**
 * Maps the language names shown in the UI to their BCP-47 language tags.
 *
 * Add each language here using exactly the same display name used in the
 * language options in app/page.tsx. The tag is passed to speech-to-text to
 * identify the recording's language and to text-to-speech to select a voice.
 * Use a tag supported by the relevant Google Speech and TTS providers; the
 * region can affect pronunciation and voice availability.
 *
 * Adding an entry here is only one part of adding a language. Also add it to
 * the UI options and confirm that the STT and TTS APIs support the selected
 * tag/provider. See the README section "How to add a language" for the full
 * setup steps.
 */
const BCP47_BY_LANGUAGE: Record<string, string> = {
    English: "en-US",
    Dari: "prs-AF",
    Swahili: "sw-TZ",
    Kinyarwanda: "rw-RW",
    Urdu: "ur-PK",
};

/**
 * Returns the BCP-47 tag for a UI language name.
 *
 * Returns null when no language is selected or the name is not in the map.
 * Callers may omit the tag or handle the missing mapping as appropriate for
 * their API request.
 */
export function toBcp47(language: string | null): string | null {
    if (!language) return null;
    return BCP47_BY_LANGUAGE[language] ?? null;
}
