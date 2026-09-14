import Image from "next/image";
import SoundIcon from "../public/sound.svg";
import { TranscriptMessage } from "@/types/transcript";

type TranscriptAreaProps = {
    messages: TranscriptMessage[];
    ownRole: "staff" | "client";
};

export default function TranscriptArea({ messages, ownRole }: TranscriptAreaProps) {
    return (
        <div className="flex-1 w-full min-h-0 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => {
                const isOwnSpeaker = message.role === ownRole;
                const isStaff = message.role === "staff";
                const text = isOwnSpeaker ? message.originalText : message.translatedText;

                return (
                    <div key={message.id} className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}>
                        <span className="text-[10px] text-gray-500 mb-0.5">
                            {message.role === "staff" ? "Staff" : "Client"}
                        </span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm font-playfair-display font-bold ${isStaff ? "bg-gray-300 text-gray-900" : "bg-gray-700 text-white"}`}>
                            {text}
                        </div>
                        <button type="button" aria-label="Play audio" className="mt-1 mx-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                            <Image src={SoundIcon} alt="" width={18} height={18} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}