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

    const handleSaveSession = () => {
        const payload = {
            staffLanguage,
            clientLanguage,
            exchanges: messages.map((m) => ({
                speaker: m.role,
                staffText: m.role === "staff" ? m.originalText : m.translatedText,
                clientText: m.role === "client" ? m.originalText : m.translatedText
            })),
        };
        //Send payload to endpoint here
    }

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