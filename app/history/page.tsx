"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionCard from "@/components/sessionCard";

type Session = {
    sessionId: string;
    staffLanguage: string;
    clientLanguage: string;
    label?: string;
    createdAt?: string;
};

export default function History() {
    const [search, setSearch] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    function formatDate(isoString: string | null | undefined): string {
        if (!isoString) return "";

        const date = new Date(isoString);
        return date.toLocaleString("en-NZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    // Fetching all sessions
    useEffect(() => {
        async function fetchSessions() {
            try {
                const response = await fetch("/api/sessions");
                const data = await response.json();

                if (!response.ok) {
                    console.error("Failed to fetch sessions: ", data.error);
                    return;
                }

                setSessions(data.sessionList);
            } catch (error) {
                console.error("Network error fetching sessions: ", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSessions();
    }, []);

    const filteredSessions = sessions.filter((s) =>
        (s.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
        s.staffLanguage.toLowerCase().includes(search.toLowerCase()) ||
        s.clientLanguage.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <p className="p-4">Loading sessions...</p>;

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <input type="text" placeholder="Search for specific session" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" />
            
            <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {filteredSessions.map((session) => (
                    <SessionCard 
                        key={session.sessionId}
                        label={session.label ?? "Untitled Session"}
                        dateTime={formatDate(session.createdAt)}
                        staffLanguage={session.staffLanguage}
                        clientLanguage={session.clientLanguage}
                        onClick={() => router.push(`/history/${session.sessionId}`)}
                    />
                ))}
            </div>
        </div>
    );
}