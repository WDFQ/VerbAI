"use client";
import Image from "next/image";
import SoundIcon from "../public/sound.svg";
import RetryIcon from "../public/retry.svg";
import { TranscriptMessage } from "@/types/transcript";
import { toBcp47 } from "@/lib/languageCodes";

/**
 * Shared transcript for thw whole conversation (staff and client messages together).
 * Staff messages are aligned left, client messages are aligned right. 
 * 
 * Each message is shown in one of three states:
 * - loading: a step is still running (spinner)
 * - error: a step failed (red box with retry button)
 * - normal: original text plus its translation (text bubble with play audio button)
 * 
 * Retries are handled by the parent (app/page.tsx), which owns the state.
 */
type TranscriptAreaProps = {
    messages: TranscriptMessage[];
    staffLanguage: string | null;
    clientLanguage: string | null;
    onRetryTranscription: (messageId: string) => void;
    onRetryTranslation: (messageId: string) => void;
};

/**
 * Requests spoken audio for some text from /api/tts and plays it in the browser. 
 * The server picks the provider (Google or ElevenLabs) based on the language code.
 * If the request fails, shows an alert with the error message but the text is still on screen.

 * @param text The text to speak (the translated text)
 * @param languageCode BCP-47 language code for the text (e.g. "en-US", "es-ES"). If null, the server will pick a default voice.
 * @returns Resolves when playback has started. Failures show an alert instead of throwing an error.
 */
async function handleTextToSpeech(text: string, languageCode: string | null): Promise<void> {
    try {
        const requestBody: { text: string; languageCode?: string } = { text: text };

        // Only send the language code when we have one (toBcp47 can return null if the language is unknown). The server will pick a default voice if it's missing.
        if (languageCode) {
            requestBody.languageCode = languageCode;
        }

        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let errorMessage = "Unknown error";

            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch {
                // no JSON body to parse
            }

            alert(`Text-to-speech failed: ${errorMessage}`);
            return;
        }

        // The API returns the audio as a blob, which we convert to an object URL and play in an HTMLAudioElement.
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // When the audio finishes playing, revoke the object URL to free up memory.
        audio.addEventListener("ended", function handleAudioPlaybackEnded() {
            URL.revokeObjectURL(audioUrl);
        });

        await audio.play();
    } catch (error) {
        console.error("Failed to play text-to-speech audio:", error);
        alert("Something went wrong while playing the audio.");
    }
}

export default function TranscriptArea({ messages, staffLanguage, clientLanguage, onRetryTranscription, onRetryTranslation }: TranscriptAreaProps) {
    return (
        <div className="flex-1 w-full min-h-0 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => {
                const isStaff = message.role === "staff";
                // The translated text is in the other party's language, so the TTS voice must match that language
                let translatedLanguage = staffLanguage;
                if (isStaff) {
                    translatedLanguage = clientLanguage;
                }
                const translatedLanguageCode = toBcp47(translatedLanguage);

                // Work out which state the message is in:
                // - originalText is null: transcription is still running or failed
                // - translatedText is null: translation is still running or failed
                // - hasError turns "still running" into "failed" for the current step
                let isLoading = false;
                let retryStage: "transcription" | "translation" | null = null;
            
                if (message.originalText === null) {
                    if (message.hasError) {
                        retryStage = "transcription";
                    } else {
                        isLoading = true;
                    }
                } else if (message.translatedText === null) {
                    if (message.hasError) {
                        retryStage = "translation";
                    } else {
                        isLoading = true;
                    }
                }

                const hasError = retryStage !== null;

                // The bubble shows a retry button if the current step failed, 
                // a spinner if it's still running, or the original + translated 
                // text if both steps succeeded.
                let messageBubble;
                
                if (retryStage !== null) {
                    // Copy into a local variable so the click handler below keeps the right value
                    const currentRetryStage = retryStage;

                    let retryAriaLabel = "Retry transcription";
                    if (currentRetryStage === "translation") {
                        retryAriaLabel = "Retry translation";
                    }

                    // Error state: retries only the step that failed, not the whole message. 
                    // The original text is still on screen if transcription succeeded but translation failed.
                    messageBubble = (
                        <div className="max-w-[85%] px-4 py-2 rounded-xl border-2 border-red-500 bg-transparent flex items-center justify-center">
                            <button
                                type="button"
                                aria-label={retryAriaLabel}
                                className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={function handleRetryClick() {
                                    if (currentRetryStage === "transcription") {
                                        onRetryTranscription(message.id);
                                    } else {
                                        onRetryTranslation(message.id);
                                    }
                                }}
                            >
                                <Image src={RetryIcon} alt="" width={18} height={18} />
                            </button>
                        </div>
                    );
                } else if (isLoading) {
                    // Loading state: the original text is hidden until translation is complete.
                    messageBubble = (
                        <div
                            role="status"
                            aria-label="Loading"
                            className="max-w-[85%] px-4 py-2 rounded-xl border-2 border-dashed border-gray-400 bg-transparent flex items-center justify-center"
                        >
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    );
                } else {
                    // Normal state: show the original text (large) plus its translation (small), with a play audio button.
                    messageBubble = (
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm font-playfair-display font-bold ${isStaff ? "bg-gray-300 text-gray-900" : "bg-gray-700 text-white"}`}>
                            <div>
                                {message.originalText}
                            </div>

                            <div className="opacity-70 text-xs mt-1">
                                {message.translatedText}
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={message.id} className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}>
                        <span className="text-[10px] text-gray-500 mb-0.5">
                            {message.role === "staff" ? "Staff" : "Client"}
                        </span>
                        {messageBubble}
                        {/* Plays the translation output, so the listener hears it in their own language.
                            Disabled while loading or failed, since there is no translation yet. */}
                        <button
                            type="button"
                            aria-label="Play audio"
                            disabled={isLoading || hasError}
                            className="mt-1 mx-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                            onClick={function handlePlayAudioClick() {
                                if (message.translatedText !== null) {
                                    handleTextToSpeech(message.translatedText, translatedLanguageCode);
                                }
                            }}
                        >
                            <Image src={SoundIcon} alt="" width={18} height={18} className="dark:invert" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}