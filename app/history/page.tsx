"use client"

import { useState } from "react";
import { useRouter } from "next/router";
import SessionCard from "@/components/sessionCard";

type Session = {
    id: string;
    label: string;
    dateTime: string;
    staffLanguage: string;
    clientLanguage: string;
};

export default function History() {
    const [search, setSearch] = useState("");
    const router = useRouter();

    //Placeholders
    const sessions: Session[] = [
        { id: "1", label: "Label", dateTime: "Date/Time of creation", staffLanguage: "English", clientLanguage: "Dari" },
        { id: "2", label: "Label", dateTime: "Date/Time of creation", staffLanguage: "English", clientLanguage: "Swahili" },
        { id: "3", label: "Label", dateTime: "Date/Time of creation", staffLanguage: "English", clientLanguage: "Kinyarwanda" },
        { id: "4", label: "Label", dateTime: "Date/Time of creation", staffLanguage: "English", clientLanguage: "Dari" },
    ];

    const filteredSessions = sessions.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.staffLanguage.toLowerCase().includes(search.toLowerCase()) ||
        s.clientLanguage.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <input type="text" placeholder="Search for specific session" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" />
            
            <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {filteredSessions.map((session) => (
                    <SessionCard 
                        key={session.id}
                        label={session.label}
                        dateTime={session.dateTime}
                        staffLanguage={session.staffLanguage}
                        clientLanguage={session.clientLanguage}
                        onClick={() => router.push(`/history/${session.id}`)}
                    />
                ))}
            </div>
        </div>
    );
}