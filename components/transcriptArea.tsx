import Image from "next/image";
import SoundIcon from "../public/sound.svg";
import { TranscriptMessage } from "@/types/transcript";
import { toBcp47 } from "@/lib/languageCodes";

type TranscriptAreaProps = {
    messages: TranscriptMessage[];
    ownRole: "staff" | "client";
    language: string | null;
};

async function handleTextToSpeech(text: string, languageCode: string | null): Promise<void> {
    try {
        const requestBody: { text: string; languageCode?: string } = { text: text };

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

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.addEventListener("ended", function handleAudioPlaybackEnded() {
            URL.revokeObjectURL(audioUrl);
        });

        await audio.play();
    } catch (error) {
        console.error("Failed to play text-to-speech audio:", error);
        alert("Something went wrong while playing the audio.");
    }
}

export default function TranscriptArea({ messages, ownRole, language }: TranscriptAreaProps) {
    const languageCode = toBcp47(language);

    return (
        <div className="flex-1 w-full min-h-0 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => {
                const isOwnSpeaker = message.role === ownRole;
                const isStaff = message.role === "staff";

                let isLoading = false;
                let text = "";

                if (isOwnSpeaker) {
                    if (message.originalText === null) {
                        isLoading = true;
                    } else {
                        text = message.originalText;
                    }
                } else {
                    if (message.translatedText === null) {
                        isLoading = true;
                    } else {
                        text = message.translatedText;
                    }
                }

                let messageBubble;
                if (isLoading) {
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
                    messageBubble = (
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm font-playfair-display font-bold ${isStaff ? "bg-gray-300 text-gray-900" : "bg-gray-700 text-white"}`}>
                            {text}
                        </div>
                    );
                }

                return (
                    <div key={message.id} className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}>
                        <span className="text-[10px] text-gray-500 mb-0.5">
                            {message.role === "staff" ? "Staff" : "Client"}
                        </span>
                        {messageBubble}
                        <button
                            type="button"
                            aria-label="Play audio"
                            disabled={isLoading}
                            className="mt-1 mx-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                            onClick={function handlePlayAudioClick() {
                                handleTextToSpeech(text, languageCode);
                            }}
                        >
                            <Image src={SoundIcon} alt="" width={18} height={18} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}