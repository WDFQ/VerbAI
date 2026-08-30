type TranscriptMessage = {
    id: string;
    originalLanguage: string;
    text: string;
    timestamp: string;
};

type TranscriptAreaProps = {
    messages: TranscriptMessage[];
    ownLanguage: string;
};

export default function TranscriptArea({ messages, ownLanguage }: TranscriptAreaProps) {
    return (
        <div className="flex-1 w-full overflow-y-auto p-3 space-y-3">
            {messages.map((message) => {
                const isOwnSpeaker = message.originalLanguage === ownLanguage;

                return (
                    <div key={message.id} className={`flex flex-col ${isOwnSpeaker ? "items-start" : "items-end"}`}>
                        <span className="text-[10px] text-gray-500 mb-500 mb-0.5">
                            Spoken in {message.originalLanguage}
                        </span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${isOwnSpeaker ? "bg-gray-300 text-gray-900" : "bg-gray-700 text-white"}`}>
                            {message.text}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}