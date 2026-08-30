"use client";

import { act, useState } from "react";
import TranslationBlock from "@/components/TranslationBlock";

export default function Home() {
    const [leftLanguage, setLeftLanguage] = useState<string | null>(null);
    const [rightLanguage, setRightLanguage] = useState<string | null>(null);
    const [activeTurn, setActiveTurn] = useState<"left" | "right" | null>(null);

    const bothLanguagesSelected = leftLanguage != null && rightLanguage != null;
    const options = ["English", "Dari", "Swahili", "Kinyarwanda"];

    return (
        <div className="flex gap-4 p-4 h-screen">
            {/* Left side */}
            <TranslationBlock 
                side="left"
                language={leftLanguage}
                onLanguageChange={setLeftLanguage}
                languageOptions={options}
                isActive={activeTurn === "left"}
                isDisabled={!bothLanguagesSelected || activeTurn === "right"}
                onMicTap={() => setActiveTurn(activeTurn === "left" ? null : "left")}
                messages={[]}
            />

            {/* Right side */}
            <TranslationBlock 
                side="right"
                language={rightLanguage}
                onLanguageChange={setRightLanguage}
                languageOptions={options}
                isActive={activeTurn === "right"}
                isDisabled={!bothLanguagesSelected || activeTurn === "left"}
                onMicTap={() => setActiveTurn(activeTurn === "right" ? null : "right")}
                messages={[]}
            />
        </div>
    )
}