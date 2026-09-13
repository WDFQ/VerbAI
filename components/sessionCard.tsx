type SessionCardProps = {
    label: string;
    dateTime: string;
    staffLanguage: string;
    clientLanguage: string;
    onClick: () => void;
}

export default function SessionCard({ label, dateTime, staffLanguage, clientLanguage, onClick }: SessionCardProps) {
    return (
        <button onClick={onClick} className="w-full h-20 bg-gray-200 rounded-lg px-4 py-3 text-left hover:bg-pink-500 transition-colors cursor-pointer">
            <p className="font-bold text-sm">{label}</p>
            <p className="text-sm text-gray-700">{dateTime}</p>
            <p className="text-sm text-gray-500">{staffLanguage} ↔ {clientLanguage}</p>
        </button>
    )
}