import Image from "next/image";
import SoundIcon from "../public/sound.svg";
import { TranscriptMessage } from "@/types/transcript";

type TranscriptAreaProps = {
    messages: TranscriptMessage[];
};

export default function TranscriptArea({ messages }: TranscriptAreaProps) {
    return (
        <div className="flex-1 w-full min-h-0 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
                <div key={message.id} className={`flex flex-col ${message.role === "staff" ? "items-start" : "items-end"}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${message.role === "staff" ? "bg-gray-300 text-gray-900" : "bg-gray-700 text-white"}`}>
                        <p>{message.originalText}</p>
                        <p className="text-xs opacity-70 italic">{message.translatedText}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}