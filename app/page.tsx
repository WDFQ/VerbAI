"use client";

import { useState } from "react";
import TranslationBlock from "@/components/translationBlock";
import { TranscriptMessage } from "@/types/transcript";

export default function Home() {
    const [staffLanguage, setStaffLanguage] = useState<string | null>(null);
    const [clientLanguage, setClientLanguage] = useState<string | null>(null);
    const [activeTurn, setActiveTurn] = useState<"staff" | "client" | null>(null);
    const [messages, setMessages] = useState<TranscriptMessage[]>([]);

    const bothLanguagesSelected = staffLanguage != null && clientLanguage != null;
    const options = ["English", "Dari", "Swahili", "Kinyarwanda"];

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

            <div className="flex gap-4 p-4 flex-1">
                {/* Staff side */}
                <TranslationBlock 
                    role="staff"
                    language={staffLanguage}
                    onLanguageChange={setStaffLanguage}
                    languageOptions={options}
                    isActive={activeTurn === "staff"}
                    isDisabled={!bothLanguagesSelected || activeTurn === "client"}
                    onMicTap={() => setActiveTurn(activeTurn === "staff" ? null : "staff")}
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
                    onMicTap={() => setActiveTurn(activeTurn === "client" ? null : "client")}
                    messages={messages}
                />
            </div>
        </div>
    )
}