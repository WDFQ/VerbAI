"use client";
import { createContext, useContext, useState, ReactNode } from "react";

/**
 * Shared "what is the app doing right now" message, for example "Getting text from speech..."
 * or "Translating...". Any component can set it and any component can show it.
 *
 * Who uses it:
 *   - app/page.tsx calls setStatus(...) while transcription and translation run, and
 *     setStatus(null) when they finish.
 *   - Whichever component reads `status` (via useStatus) displays it. A null status means idle.
 *
 * StatusProvider must wrap the whole app (in app/layout.tsx) so both the page that sets
 * the status and the component that shows it share the same state.
 */
type StatusContextValue = {
    status: string | null; // current message to show, or null when nothing is in progress
    setStatus: (status: string | null) => void;
};

// Null by default so useStatus() can detect a missing StatusProvider
const StatusContext = createContext<StatusContextValue | null>(null);

export function StatusProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<string | null>(null);

    return (
        <StatusContext.Provider value={{ status, setStatus }}>
            {children}
        </StatusContext.Provider>
    );
}

/**
 * Read or update the shared status: const { status, setStatus } = useStatus()
 * @throws if used outside a StatusProvider (for example, if the provider is removed from
 * app/layout.tsx), which fails loudly instead of silently showing nothing.
 */
export function useStatus() {
    const context = useContext(StatusContext);
    if (!context) {
        throw new Error("useStatus must be used within a StatusProvider");
    }
    return context;
}
