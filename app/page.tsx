"use client";

import { useState, useRef } from "react";
import TranslationBlock from "@/components/translationBlock";
import { TranscriptMessage } from "@/types/transcript";
import { useAudioRecorder, blobToBase64 } from "@/hooks/useAudioRecorder";
import { toBcp47 } from "@/lib/languageCodes";
import { useStatus } from "@/contexts/statusContext";
import { Save } from "lucide-react";
import SaveSessionPopup from "@/components/saveSessionPopup";

/**
 * Main translation screen (route "/").
 * 
 * Flow for one spoken message:
 *  mic tap -> start recording -> mic tap again -> stop recording -> send to STT -> show transcribed text -> send to LLM for translation -> show translated text
 *  in the shared transcript.
 * Audio playback (TTS) is triggered by the user clicking the speaker button next to each message, which sends the text to the TTS API and plays the returned audio.
 * 
 * Nothing is stored until the user saves the session, which sends the transcript to the server to be stored in Firestore.
 * Refreshing the page or starting a New Sessoin will clear the transcript and any unsaved data.
 */

// Audio recording data that is kept around for each message so that a failed transcription can be retried without having to re-record
type RecordingData = {
    audioBase64: string;
    languageCode: string;
};

export default function Home() {
    const [staffLanguage, setStaffLanguage] = useState<string | null>(null);
    const [clientLanguage, setClientLanguage] = useState<string | null>(null);

    // Which role is currently recording (or null if neither is recording). This is used to disable the other role's mic button while one is recording.
    const [activeTurn, setActiveTurn] = useState<"staff" | "client" | null>(null);

    // The shared transcript of messages between the staff and client. Each message has a role (staff or client), the original text (from STT), the translated text (from LLM), and a timestamp.
    const [messages, setMessages] = useState<TranscriptMessage[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // The session ID is generated when the user first saves the session, and is kept around so that if they save again it will overwrite the same session rather than creating a new one.
    const sessionIdRef = useRef<string | null>(null);
    const { setStatus } = useStatus();

    const [showSavePopup, setShowSavePopup] = useState(false);

    // Mics stay disabled until both languages are selected, to avoid recording in the wrong language.
    const bothLanguagesSelected = staffLanguage != null && clientLanguage != null;
    
    // NOTE: these options must also exist in BCP47_BY_LANGUAGE (lib/languageCodes.ts) and in the TTS/STT APIs, 
    // otherwise the user will get an error when trying to record or play audio.
    // See README, "How to add a language" for instructions on how to add a new language.
    const options = ["English", "Dari", "Swahili", "Kinyarwanda", "Urdu"];

    const recorder = useAudioRecorder();

    // Keeps the recorded audio for each message around so a failed transcription can be retried.
    const recordingDataByMessageId = useRef<Map<string, RecordingData>>(new Map());

    function markMessageAsErrored(messageId: string) {
        setMessages((prev) => prev.map((message) => {
            if (message.id === messageId) {
                return { ...message, hasError: true };
            }
            return message;
        }));
    }

    function clearMessageError(messageId: string) {
        setMessages((prev) => prev.map((message) => {
            if (message.id === messageId) {
                return { ...message, hasError: false };
            }
            return message;
        }));
    }

    // Translates the given text from the source language to the target language using the LLM API (staff speech -> client language
    // and vice versa). Called after transcription is complete, or when the user retries a failed translation.
    async function runTranslation(role: "staff" | "client", messageId: string, sttText: string) {
        try {
            setStatus("Translating...");
            clearMessageError(messageId);
            const targetLanguage = role === "staff" ? clientLanguage : staffLanguage;
            const translationResponse = await fetch("/api/llm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "sttText": sttText, "targetLanguage": targetLanguage })
            });

            if (!translationResponse.ok) {
                const errorData = await translationResponse.json();
                alert(`Translation failed: ${errorData.error ?? "unknown error"}`);
                markMessageAsErrored(messageId);
                return;
            }

            const translation = await translationResponse.json();

            setMessages((prev) => prev.map((message) => {
                if (message.id === messageId) {
                    return { ...message, translatedText: translation.translatedText, hasError: false };
                }
                return message;
            }));
        } catch (error) {
            console.error("Failed to translate message:", error);
            alert("Something went wrong while translating.");
            markMessageAsErrored(messageId);
        } finally {
            setStatus(null);
        }
    }

    // Sends the recorded audio to the STT API for transcription, and then calls runTranslation() to translate the transcribed text. 
    // Also called by the retry button, using the audio saved in recordingDataByMessageId.
    async function runTranscription(role: "staff" | "client", messageId: string, audioBase64: string, languageCode: string) {
        try {
            setStatus("Getting text from speech...");
            clearMessageError(messageId);
            const response = await fetch("/api/stt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audioBase64, languageCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Transcription failed: ${data.error ?? "unknown error"}`);
                markMessageAsErrored(messageId);
                return;
            }

            // Empty transcript means no speech was detected, so we remove the placeholder and 
            // its stored audio instead of leaving a retry button.
            if (!data.transcript || data.transcript.trim() === "") {
                alert("No speech detected. Please try again.");
                setMessages((prev) => prev.filter((message) => message.id !== messageId));
                recordingDataByMessageId.current.delete(messageId);
                return;
            }

            // Show the transcribed text right away, before translation finishes.
            setMessages((prev) => prev.map((message) => {
                if (message.id === messageId) {
                    return { ...message, originalText: data.transcript, hasError: false };
                }
                return message;
            }));

            await runTranslation(role, messageId, data.transcript);
        } catch (error) {
            console.error("Failed to transcribe recording:", error);
            alert("Something went wrong while transcribing.");
            markMessageAsErrored(messageId);
        } finally {
            setStatus(null);
        }
    }

    // Retry after a failed transcription. Uses the audio saved in recordingDataByMessageId to avoid having to re-record.
    // Only works while the page stays open (refreshing the page will clear the saved audio).
    async function handleRetryTranscription(messageId: string) {
        const recordingData = recordingDataByMessageId.current.get(messageId);
        const message = messages.find((message) => message.id === messageId);

        if (!recordingData || !message) {
            alert("Unable to retry: the original recording is no longer available.");
            return;
        }

        await runTranscription(message.role, messageId, recordingData.audioBase64, recordingData.languageCode);
    }

    // Retry after a failed translation. Uses the original text from the message to avoid having to re-record or re-transcribe.
    async function handleRetryTranslation(messageId: string) {
        const message = messages.find((message) => message.id === messageId);

        if (!message || message.originalText === null) {
            return;
        }

        await runTranslation(message.role, messageId, message.originalText);
    }

    // One handler for both mic buttons. First tap starts recording, second tap stops recording 
    // and sends the audio to the STT API for transcription.
    const handleMicTap = async (role: "staff" | "client") => {
        if (activeTurn === null) {
            // Starting a new recording
            try {
                await recorder.start();
                setActiveTurn(role);
            } catch (error) {
                if (error instanceof DOMException && error.name === "NotAllowedError") {
                    alert("Microphone access was denied. Please allow microphone permissions in your browser settings.");
                } else if (error instanceof DOMException && error.name === "NotFoundError") {
                    alert("No microphone was found. Please connect a microphone and try again.");
                } else {
                    console.error("Failed to start recording:", error);
                    alert("Could not start recording. Please try again.");
                }
            }
            return;
        }

        // Ensure you don't record for the inactive role
        if (activeTurn !== role) {
            return;
        }

        // Stopping the active recording for this role
        try {
            const blob = await recorder.stop();
            setActiveTurn(null);

            // Convert audio file into correct format
            const audioBase64 = await blobToBase64(blob);
            // Language code is based on the speaker's own language, for speech-to-text transcription.
            const languageCode = toBcp47(role === "staff" ? staffLanguage : clientLanguage);

            if (!languageCode) {
                alert("Unsupported language selected. Please choose a different language.");
                return;
            }

            // Show a loading placeholder right away, before transcription finishes
            const messageId = crypto.randomUUID();
            const newMessage: TranscriptMessage = {
                id: messageId,
                role,
                originalText: null,
                translatedText: null,
                hasError: false,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, newMessage]);
            recordingDataByMessageId.current.set(messageId, { audioBase64, languageCode });

            await runTranscription(role, messageId, audioBase64, languageCode);
        } catch (error) {
            console.error("Failed to process recording:", error);
            alert("Something went wrong while processing the recording.");
        }
    };

    // Saves the whole conversation to Firestore via POST /api/sessions. 
    // The session ID is generated the first time the user saves, and is kept around so 
    // that if they save again it will overwrite the same session rather than creating a new one.
    // (the API replies with 409 if it already exists).
    const handleSaveSession = async (label: string) => {
        if (isSaving || hasSaved) {
            return;
        }

        if (sessionIdRef.current === null) {
            sessionIdRef.current = crypto.randomUUID();
        }

        setIsSaving(true);
        const payload = {
            sessionId: sessionIdRef.current,
            staffLanguage,
            clientLanguage,
            label: label?.trim() || undefined,
            // staffText / clientText describe the LANGUAGE of each line, not who
            // spoke: staffTexr is always the staff language version, clientText is
            // always the client language version. "speaker" says who actually said it.
            // TODO: messages still loading or errored have null text and are sent as-is.
            // Consider filtering them out or blocking the save button until none remain.
            exchanges: messages.map((m) => ({
                speaker: m.role,
                staffText: m.role === "staff" ? m.originalText : m.translatedText,
                clientText: m.role === "client" ? m.originalText : m.translatedText
            })),
        };

        try {
            const response = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            let data: { error?: string; success?: boolean; sessionId?: string } = {};
            try {
                data = await response.json();
            } catch {
                // no JSON body to parse
            }

            switch (response.status) {
                case 200:
                    setHasSaved(true);
                    alert("Session saved successfully.");
                    break;
                case 409:
                    // Already exists, so treat it as saved
                    setHasSaved(true);
                    alert("This session has already been saved.");
                    break;
                case 400:
                    alert(`Could not save session: ${data.error ?? "the request data was invalid."}`);
                    break;
                case 500:
                    alert("Something went wrong on the server. Please try again later.");
                    break;
                case 502:
                    alert(`Failed to save session: ${data.error ?? "the server could not write to the database."} Please try again.`);
                    break;
                default:
                    alert(`Unexpected response from server (status ${response.status}). Please try again or contact support.`);
            }
        } catch (error) {
            console.error("Network error while saving session:", error);
            alert("Could not reach the server. Check your internet connection and try again.");
        } finally {
            setIsSaving(false);
        }
    };

    let saveButtonLabel = "Save session";
    if (isSaving) {
        saveButtonLabel = "Saving...";
    }
    if (hasSaved) {
        saveButtonLabel = "Saved";
    }

    // Generates a default label for the session based on the current date and time.
    const generateDefaultLabel = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
        return `${dateStr} — ${staffLanguage}/${clientLanguage}`;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Save button: opens the popup where staff can edit the label */}
            <button
                onClick={() => setShowSavePopup(true)}
                disabled={isSaving || hasSaved}
                className="flex items-center justify-center gap-2 px-4 py-2 m-2 rounded-lg bg-white dark:bg-card border border-deep-pink text-black dark:text-white cursor-pointer font-playfair-display font-bold transition-colors duration-150 hover:bg-deep-pink hover:text-white dark:hover:bg-deep-pink dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save className="size-4" />
                {saveButtonLabel}
            </button>

            {/* Popup for saving the session */}
            <SaveSessionPopup
                isOpen={showSavePopup}
                onClose={() => setShowSavePopup(false)}
                defaultLabel={generateDefaultLabel()}
                onSave={handleSaveSession}
            />

            <div className="flex-1 min-h-0 p-4">
                {/* Language selectors, shared transcript and both mic buttons */}
                <TranslationBlock
                    staffLanguage={staffLanguage}
                    onStaffLanguageChange={setStaffLanguage}
                    clientLanguage={clientLanguage}
                    onClientLanguageChange={setClientLanguage}
                    languageOptions={options}
                    activeTurn={activeTurn}
                    bothLanguagesSelected={bothLanguagesSelected}
                    onMicTap={handleMicTap}
                    messages={messages}
                    onRetryTranscription={handleRetryTranscription}
                    onRetryTranslation={handleRetryTranslation}
                />
            </div>
        </div>
    );
}