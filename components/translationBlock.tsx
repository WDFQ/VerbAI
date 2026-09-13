"use client";

import Image from "next/image";
import MicIcon from "../public/mic.svg";
import StopIcon from "../public/stop.svg";
import LanguageSelector from "./languageSelector";
import TranscriptArea from "./transcriptArea";
import { TranscriptMessage } from "@/types/transcript";

type TranslationBlockProps = {
    staffLanguage: string | null;
    onStaffLanguageChange: (lang: string) => void;
    clientLanguage: string | null;
    onClientLanguageChange: (lang: string) => void;
    languageOptions: string[];
    activeTurn: "staff" | "client" | null;
    bothLanguagesSelected: boolean;
    onMicTap: (role: "staff" | "client") => void;
    messages: TranscriptMessage[];
};

export default function TranslationBlock({ staffLanguage, onStaffLanguageChange, clientLanguage, onClientLanguageChange, languageOptions, activeTurn, bothLanguagesSelected, onMicTap, messages }: TranslationBlockProps) {
    return (
        <div className="flex flex-col bg-gray-200 rounded-2xl p-4 w-full h-full min-h-0">
            <div className="flex justify-between w-full">
                {/* Language selectors */}
                <div className="flex items-center gap-2">
                    <h1 className="font-playfair-display font-bold">Staff</h1>
                    <LanguageSelector language={staffLanguage} onSelect={onStaffLanguageChange} options={languageOptions} />
                </div>

                <div className="flex items-center gap-2">
                    <h1 className="font-playfair-display font-bold">Client</h1>
                    <LanguageSelector language={clientLanguage} onSelect={onClientLanguageChange} options={languageOptions} />
                </div>
            </div>

            {/* Shared transcript area */}
            <TranscriptArea messages={messages} />

            {/* Mic buttons */}
            <div className="flex justify-around">
                <button onClick={() => onMicTap("staff")} disabled={!bothLanguagesSelected || activeTurn === "client"} className={`flex items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors ${
                    activeTurn === "staff" ? "bg-pink-500" : "bg-gray-600"} ${!bothLanguagesSelected || activeTurn === "client" ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <Image src={activeTurn === "staff" ? StopIcon : MicIcon} alt={activeTurn === "staff" ? "Stop" : "Microphone"} width={24} height={24} />
                </button>

                <button onClick={() => onMicTap("client")} disabled={!bothLanguagesSelected || activeTurn === "staff"} className={`flex items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors ${
                    activeTurn === "client" ? "bg-pink-500" : "bg-gray-600"} ${!bothLanguagesSelected || activeTurn === "staff" ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <Image src={activeTurn === "client" ? StopIcon : MicIcon} alt={activeTurn === "client" ? "Stop" : "Microphone"} width={24} height={24} />
                </button>
            </div>
        </div>
    );
}