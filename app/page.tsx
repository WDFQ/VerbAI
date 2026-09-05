"use client";

import { useState } from "react";
import TranslationBlock from "@/components/translationBlock";
import { TranscriptMessage } from "@/types/transcript";
import { useAudioRecorder, blobToBase64 } from "@/hooks/useAudioRecorder";
import { toBcp47 } from "@/lib/languageCodes";

export default function Home() {
    const [staffLanguage, setStaffLanguage] = useState<string | null>(null);
    const [clientLanguage, setClientLanguage] = useState<string | null>(null);
    const [activeTurn, setActiveTurn] = useState<"staff" | "client" | null>(null);
    const [messages, setMessages] = useState<TranscriptMessage[]>([]);

    const bothLanguagesSelected = staffLanguage != null && clientLanguage != null;
    const options = ["English", "Dari", "Swahili", "Kinyarwanda"];

    const recorder = useAudioRecorder();

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

            // Call the speech to text API
            const response = await fetch("/api/stt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audioBase64, languageCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Transcription failed: ${data.error ?? "unknown error"}`);
                return;
            }

            // Call the translation API
            const translationResponse = await fetch("/api/llm", {
                method: "POST",
                headers: { "Content-Type": "application.json" },
                body: JSON.stringify({ "sttText": data.transcript, "targetLanguage": role === "staff" ? staffLanguage : clientLanguage})
            })

            if (!translationResponse.ok) {
                alert(`Translation failed: ${data.error ?? "unknown error"}`);
                return;
            }

            const translation = await translationResponse.json();

            const newMessage: TranscriptMessage = {
                id: crypto.randomUUID(),
                role,
                originalText: data.transcript,
                translatedText: translation.translatedText,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, newMessage]);
        } catch (error) {
            console.error("Failed to process recording:", error);
            alert("Something went wrong while processing the recording.");
        }
    };

    const handleSaveSession = async () => {
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

    return (
        <div className="flex flex-col h-full">
            {/* Save button */}
            <button onClick={handleSaveSession} className="px-4 py-2 bg-pink-500 text-black rounded cursor-pointer">
                Save session
            </button>

            <div className="flex gap-4 p-4 flex-1 min-h-0">
                {/* Staff side */}
                <TranslationBlock 
                    role="staff"
                    language={staffLanguage}
                    onLanguageChange={setStaffLanguage}
                    languageOptions={options}
                    isActive={activeTurn === "staff"}
                    isDisabled={!bothLanguagesSelected || activeTurn === "client"}
                    onMicTap={() => handleMicTap("staff")}
                    messages={messages}
                />

                {/* Client side */}
                <TranslationBlock 
                    role="client"
                    language={clientLanguage}
                    onLanguageChange={setClientLanguage}
                    languageOptions={options}
                    isActive={activeTurn === "client"}
                    isDisabled={!bothLanguagesSelected || activeTurn === "staff"}
                    onMicTap={() => handleMicTap("client")}
                    messages={messages}
                />
            </div>
        </div>
    )
}