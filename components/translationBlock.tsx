"use client";
import Image from "next/image";
import MicIcon from "../public/mic.svg";
import StopIcon from "../public/stop.svg";
import LanguageSelector from "./languageSelector";
import TranscriptArea from "./transcriptArea";
import { TranscriptMessage } from "@/types/transcript";

/** The main translation panel: language selectors on top, shared transcript area in the 
 * middle, and one mic button per speaker at the bottom.
 * 
 * This component holds no state of its own. Everything (languages, messages, active turn) 
 * lives in app/page.tsx is passed in as props, so changes to recording or translation logic
 * belong there, not here. This component is only responsible for rendering the UI and calling 
 * the appropriate callback functions when the user interacts with it.
 */
type TranslationBlockProps = {
    staffLanguage: string | null;
    onStaffLanguageChange: (lang: string) => void;
    clientLanguage: string | null;
    onClientLanguageChange: (lang: string) => void;
    // Display names, e.g. "Dari". Must match the keys in lib/languageCodes.ts
    languageOptions: string[];
    // Who is currently recording, or null if nobody is recording.
    activeTurn: "staff" | "client" | null;
    bothLanguagesSelected: boolean;
    // Called with the role of the mic that was tapped (start or stop is decided by the parent)
    onMicTap: (role: "staff" | "client") => void;
    messages: TranscriptMessage[];
    onRetryTranscription: (messageId: string) => void;
    onRetryTranslation: (messageId: string) => void;
};

export default function TranslationBlock({ staffLanguage, onStaffLanguageChange, clientLanguage, onClientLanguageChange, languageOptions, activeTurn, bothLanguagesSelected, onMicTap, messages, onRetryTranscription, onRetryTranslation }: TranslationBlockProps) {
    return (
        <div className="flex flex-col bg-gray-200 dark:bg-card rounded-2xl p-4 w-full h-full min-h-0">
            <div className="flex justify-between w-full">
                {/* Language selectors: staff on the left, client on the right.
                    Each speaker's mic uses their own language for speech-to-text. */}
                <div className="flex flex-col items-start gap-2">
                    <h1 className="font-playfair-display font-bold">Staff</h1>
                    <LanguageSelector language={staffLanguage} onSelect={onStaffLanguageChange} options={languageOptions} />
                </div>

                <div className="flex flex-col items-end gap-2">
                    <h1 className="font-playfair-display font-bold">Client</h1>
                    <LanguageSelector language={clientLanguage} onSelect={onClientLanguageChange} options={languageOptions} />
                </div>
            </div>

            {/* Shared transcript area: one conversation for both speakers.
                The language props are used to pick the right voices for text-to-speech. */}
            <TranscriptArea
                messages={messages}
                staffLanguage={staffLanguage}
                clientLanguage={clientLanguage}
                onRetryTranscription={onRetryTranscription}
                onRetryTranslation={onRetryTranslation}
            />

            {/* Mic buttons. Each is disabled until both languages are selected, and while
                the OTHER speaker is talking, which enforces one speaker at a time. 
                The active speaker's button switches to a stop icon so they can end their turn. */}
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