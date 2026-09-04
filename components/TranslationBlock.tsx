"use client";

import Image from "next/image";
import MicIcon from "../public/mic.svg";
import StopIcon from "../public/stop.svg";
import LanguageSelector from "./LanguageSelector";
import TranscriptArea from "./TranscriptArea";
import { TranscriptMessage } from "@/types/transcript";

type TranslationBlockProps = {
    role: "staff" | "client";
    language: string | null;
    onLanguageChange: (lang: string) => void;
    languageOptions: string[];
    isActive: boolean;
    isDisabled: boolean;
    onMicTap: () => void;
    messages: TranscriptMessage[];
};

export default function TranslationBlock({ role, language, onLanguageChange, languageOptions, isActive, isDisabled, onMicTap, messages }: TranslationBlockProps) {
    return (
        <div className="flex flex-col items-center bg-gray-200 rounded-2xl p-4 w-full h-full">
            {/* Language Selector */}
            <LanguageSelector language={language} onSelect={onLanguageChange} options={languageOptions} />

            {/* Transcript Area */}
            <TranscriptArea messages={messages} ownRole={role} />

            {/* Mic Button */}
            <button onClick={onMicTap} disabled={isDisabled} className={`flex items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors ${
                isActive ? "bg-pink-500" : "bg-gray-600"} ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}>
                <Image src={isActive ? StopIcon : MicIcon} alt={isActive ? "Stop" : "Microphone"} width={24} height={24} />
            </button>
        </div>
    );
}