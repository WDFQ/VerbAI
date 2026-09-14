"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type StatusContextValue = {
    status: string | null;
    setStatus: (status: string | null) => void;
};

const StatusContext = createContext<StatusContextValue | null>(null);

export function StatusProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<string | null>(null);

    return (
        <StatusContext.Provider value={{ status, setStatus }}>
            {children}
        </StatusContext.Provider>
    );
}

export function useStatus() {
    const context = useContext(StatusContext);
    if (!context) {
        throw new Error("useStatus must be used within a StatusProvider");
    }
    return context;
}
