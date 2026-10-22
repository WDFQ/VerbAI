"use client";

import { useState, useEffect } from "react";

type SaveSessionPopupProps = {
    isOpen: boolean;
    onClose: () => void;
    defaultLabel: string;
    onSave: (label: string) => void;
};

/**
 * Shows a modal for naming and saving a session.
 *
 * Initializes the input from defaultLabel whenever the modal opens. Calls
 * onSave with the entered label and closes on success; prevents duplicate saves
 * while a save is already in progress.
 */
export default function SaveSessionPopup({ isOpen, onClose, defaultLabel, onSave }: SaveSessionPopupProps) {
    const [label, setLabel] = useState(defaultLabel);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLabel(defaultLabel);
        }
    }, [isOpen, defaultLabel]);

    const handleSave = async () => {
        if (isSaving) return; // Prevent multiple saves
        setIsSaving(true);
        try {
            await onSave(label);
            onClose();
        } catch (error) {
            console.error("Error saving session:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleSave();
        }
    };
    
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-80">
                <label className="block text-sm font-bold mb-2">Session Name:</label>
                <input 
                    value={label} 
                    onChange={(e) => setLabel(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    className="w-full border rounded px-3 py-2 mb-4" 
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 cursor-pointer">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-gray-900 text-white rounded text-sm cursor-pointer disable:opacity-50 disabled:cursor-not-allowed" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}