type SessionCardProps = {
    label: string;
    dateTime: string;
    staffLanguage: string;
    clientLanguage: string;
    onClick: () => void;
}

export default function SessionCard({ label, dateTime, staffLanguage, clientLanguage, onClick }: SessionCardProps) {
    return (
        <button onClick={onClick} className="group w-full h-20 bg-gray-200 rounded-lg px-4 py-3 text-left hover:bg-deep-pink transition-colors cursor-pointer">
            <p className="font-bold text-sm group-hover:text-white">{label}</p>
            <p className="text-sm text-gray-700 group-hover:text-white">{dateTime}</p>
            <p className="text-sm text-gray-500 group-hover:text-white/80">{staffLanguage} ↔ {clientLanguage}</p>
        </button>
    )
}