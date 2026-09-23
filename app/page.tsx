"use client";

import { useState, useRef } from "react";
import TranslationBlock from "@/components/translationBlock";
import { TranscriptMessage } from "@/types/transcript";
import { useAudioRecorder, blobToBase64 } from "@/hooks/useAudioRecorder";
import { toBcp47 } from "@/lib/languageCodes";
import { useStatus } from "@/contexts/statusContext";
import { Save } from "lucide-react";
import SaveSessionPopup from "@/components/saveSessionPopup";

type RecordingData = {
    audioBase64: string;
    languageCode: string;
};

export default function Home() {
    const [staffLanguage, setStaffLanguage] = useState<string | null>(null);
    const [clientLanguage, setClientLanguage] = useState<string | null>(null);
    const [activeTurn, setActiveTurn] = useState<"staff" | "client" | null>(null);
    const [messages, setMessages] = useState<TranscriptMessage[]>([]);
    const { setStatus } = useStatus();

    const [showSavePopup, setShowSavePopup] = useState(false);

    const bothLanguagesSelected = staffLanguage != null && clientLanguage != null;
    const options = ["English", "Dari", "Swahili", "Kinyarwanda"];

    const recorder = useAudioRecorder();

    // Keeps the recorded audio for each message around so a failed transcription can be retried
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

            if (!data.transcript || data.transcript.trim() === "") {
                alert("No speech detected. Please try again.");
                setMessages((prev) => prev.filter((message) => message.id !== messageId));
                recordingDataByMessageId.current.delete(messageId);
                return;
            }

            // Show the transcribed text right away, before translation finishes
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

    //TESTING SAVING (DELETE)
    const loadMockMessages = () => {
        setStaffLanguage("English");
        setClientLanguage("Dari");
        setMessages([
            {
                id: crypto.randomUUID(),
                role: "staff",
                originalText: "Hi, how are you today?",
                translatedText: "سلام، امروز چطور هستید؟",
                hasError: false,
                timestamp: new Date().toISOString(),
            },
            {
                id: crypto.randomUUID(),
                role: "client",
                originalText: "من به کمک برای درخواست ویزای خود نیاز دارم.",
                translatedText: "I need help with my visa application.",
                hasError: false,
                timestamp: new Date().toISOString(),
            },
        ]);
    };

    async function handleRetryTranscription(messageId: string) {
        const recordingData = recordingDataByMessageId.current.get(messageId);
        const message = messages.find((message) => message.id === messageId);

        if (!recordingData || !message) {
            alert("Unable to retry: the original recording is no longer available.");
            return;
        }

        await runTranscription(message.role, messageId, recordingData.audioBase64, recordingData.languageCode);
    }

    async function handleRetryTranslation(messageId: string) {
        const message = messages.find((message) => message.id === messageId);

        if (!message || message.originalText === null) {
            return;
        }

        await runTranslation(message.role, messageId, message.originalText);
    }

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

    const handleSaveSession = async (label: string) => {
        const payload = {
            sessionId: crypto.randomUUID(),
            staffLanguage,
            clientLanguage,
            exchanges: messages.map((m) => ({
                speaker: m.role,
                staffText: m.role === "staff" ? m.originalText : m.translatedText,
                clientText: m.role === "client" ? m.originalText : m.translatedText
            })),
        };

        //DEBUGGING
        console.log("Saving session with payload:", payload);

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
                    alert("Session saved successfully.");
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
        }
    };

    // Generates a default label for the session based on the current date and time
    const generateDefaultLabel = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
        return `${dateStr} — ${staffLanguage}/${clientLanguage}`;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Save button */}
            <button onClick={() => setShowSavePopup(true)} className="px-4 py-2 m-2 rounded bg-white border border-deep-pink text-black rounded cursor-pointer font-playfair-display font-bold">
                Save session
            </button>

            {/* Popup for saving the session */}
            <SaveSessionPopup
                isOpen={showSavePopup}
                onClose={() => setShowSavePopup(false)}
                defaultLabel={generateDefaultLabel()}
                onSave={handleSaveSession}
            />

            {/* TESTING SAVING (DELETE) */}
            {process.env.NODE_ENV === "development" && (
                <button onClick={loadMockMessages} className="px-4 py-2 m-2 rounded bg-yellow-200 text-black rounded cursor-pointer font-playfair-display font-bold">
                    Load Mock Data (dev only)
                </button>
            )}

            <div className="flex-1 min-h-0 p-4">
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