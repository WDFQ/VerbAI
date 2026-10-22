"use client";
import { useEffect, useState, use } from "react";

// Shape of GET /api/sessions/[sessionId] (see app/api/sessions/[sessionId]/route.ts).
// staffText / clientText are the staff-language and client-language versions of a line,
// NOT who spoke; "speaker" says who said it.
type Exchange = {
    speaker: "staff" | "client";
    staffText: string;
    clientText: string;
    order: number; // Position in the conversation. The API already sorts exchanges by this, so the frontend can just display them in order.
};

type SessionDetails = {
    sessionId: string;
    label?: string; // Can be missing or null if the session was saved without a label
    staffLanguage: string;
    clientLanguage: string;
    createdAt?: string; // ISO timestamps from the API
    exchanges: Exchange[];
};

type SessionDetailsPageProps = {
    params: Promise<{ id: string }>;
};

/**
 * Session detail page (route "/history/[id]"): shows one saved conversation, read-only.
 * Opened from a card on the History page.
 *
 * The data is fetched in the browser after the page loads (not on the server), so there is
 * a brief loading state. Layout matches the live transcript: staff messages on the left,
 * client messages on the right, each with its translation underneath.
 *
 * TODO: no authentication. Anyone who has a session's URL can open it.
 */
export default function SessionDetailsPage({ params }: SessionDetailsPageProps) {
    // use() unwraps the params Promise. It's the client-component equivalent of `await params`
    const { id } = use(params);
    const [session, setSession] = useState<SessionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Turns the API's ISO timestamp into e.g. "22 Oct 2026, 1:30 pm". Returns "" if there is none.
    // NOTE: the History list page has a similar formatter. Move both into one shared helper
    // (for example lib/formatDate.ts) so they can't drift apart.
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

    // Load the session whenever the ID in the URL changes
    useEffect(() => {
        async function fetchSession() {
            try {
                const response = await fetch(`/api/sessions/${id}`);
                // NOTE: every failure (404 not found, 502 database error) shows the same
                // "Session not found." message below
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
            {/* "||" (not "??") so an empty-string label also falls back to the default */}
            <h1 className="font-bold text-lg">{session.label || "Untitled Session"}</h1>
            <p className="text-sm text-gray-600">{formatDate(session.createdAt)}</p>
            <p className="text-sm text-gray-600">{session.staffLanguage} ↔ {session.clientLanguage}</p>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                {session.exchanges.map((exchange, index) => {
                    const isStaff = exchange.speaker === "staff";
                    // Show what the speaker actually said first (large), then the translation
                    // (smaller), the same order as the live transcript. For a staff message that's
                    // staffText then clientText, and for a client message it's the other way round.
                    const primaryText = isStaff ? exchange.staffText : exchange.clientText;
                    const secondaryText = isStaff ? exchange.clientText : exchange.staffText;

                    return (
                        // Index is safe to use as the key because saved exchanges are never reordered or edited
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