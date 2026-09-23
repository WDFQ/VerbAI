"use client";

import { useEffect, useState, use } from "react";

type Exchange = {
    speaker: "staff" | "client";
    staffText: string;
    clientText: string;
    order: number;
};

type SessionDetail = {
    sessionId: string;
    label?: string;
    staffLanguage: string;
    clientLanguage: string;
    createdAt?: string;
    exchanges: Exchange[];
};

type SessionDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default function SessionDetailsPage({ params }: SessionDetailPageProps) {
    const { id } = use(params);
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    useEffect(() => {
        async function fetchSession() {
            try {
                const response = await fetch(`/api/sessions/${id}`);
                if (!response.ok) {
                    setError(true);
                    return;
                }
                const data = await response.json();
                setSession(data);
            } catch (err) {
                console.error("Error fetching session details: ", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchSession();
    }, [id]);

    if (loading) return <p className="p-4">Loading session details...</p>;
    if (error || !session) return <p className="p-4">Session not found.</p>;

    return (
        <div className="flex flex-col h-full p-4">
            <h1 className="font-bold text-lg">{session.label || "Untitled Session"}</h1>
            <p className="text-sm text-gray-600">{formatDate(session.createdAt)}</p>
            <p className="text-sm text-gray-600">{session.staffLanguage} ↔ {session.clientLanguage}</p>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                {session.exchanges.map((exchange, index) => {
                    const isStaff = exchange.speaker === "staff";
                    const primaryText = isStaff ? exchange.staffText : exchange.clientText;
                    const secondaryText = isStaff ? exchange.clientText : exchange.staffText;

                    return (
                        <div key={index} className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}>
                            <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm font-playfair-display font-bold ${isStaff ? "bg-gray-300 text-gray-900" : "bg-gray-700 text-white"}`}>
                                <p>{primaryText}</p>
                                <p className="opacity-70">{secondaryText}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}