"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionCard from "@/components/sessionCard";

// One item from GET /api/sessions (see app/api/sessions/route.ts).
// The list does NOT include the conversation text; that's loaded on the detail page.
type Session = {
    sessionId: string;
    staffLanguage: string;
    clientLanguage: string;
    label?: string;
    createdAt?: string;
};

/**
 * History page (route "/history"): lists every saved session, newest first, with a search box.
 * Selecting a card opens that session's read-only detail page (app/history/[id]/page.tsx).
 *
 * Sessions are fetched in the browser once, when the page opens. Search then filters the loaded
 * list on the device, so it needs no extra requests.
 *
 * TODO: no authentication, so every saved conversation is listed for anyone who has the URL.
 * The wireframe planned a staff PIN for this page, which isn't built yet.
 * TODO: no pagination. Every session is fetched at once, which will get slow as the list grows.
 */
export default function History() {
    const [search, setSearch] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [dotCount, setDotCount] = useState(1);
    const router = useRouter();

    // Turns the API's ISO timestamp into e.g. "22 Oct 2026, 1:30 pm". Returns "" if there is none.
    // NOTE: the session detail page has an identical copy of this. Move both into one shared
    // helper (for example lib/formatDate.ts) so they can't drift apart.
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

                // NOTE: failures are only logged. The page then shows an empty list, so the user
                // can't tell "no sessions saved yet" from "couldn't load them".
                if (!response.ok) {
                    console.error("Failed to fetch sessions: ", data.error);
                    return;
                }

                // The API wraps the array in an object: { sessionList: [...] }
                setSessions(data.sessionList);
            } catch (error) {
                console.error("Network error fetching sessions: ", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSessions();
    }, []);

    // Cycling the loading ellipsis: "." -> ".." -> "..." -> "."
    // Runs only while loading, and clears its timer when loading ends or the page closes
    useEffect(() => {
        if (!loading) {
            return;
        }

        const intervalId = setInterval(function () {
            setDotCount(function (previousCount) {
                if (previousCount >= 3) {
                    return 1;
                }
                return previousCount + 1;
            });
        }, 500);

        return function () {
            clearInterval(intervalId);
        };
    }, [loading]);

    // Case-insensitive match on the label or either language.
    // TODO: searching by date/time is not yet implemented.
    const filteredSessions = sessions.filter((s) =>
        (s.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
        s.staffLanguage.toLowerCase().includes(search.toLowerCase()) ||
        s.clientLanguage.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <p className="p-4 font-playfair-display font-medium">
                Loading sessions{".".repeat(dotCount)}
            </p>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <input type="text" placeholder="Search for specific session" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" />
            
            <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {filteredSessions.map((session) => (
                    // Each card links to /history/{sessionId}, which loads the full conversation
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