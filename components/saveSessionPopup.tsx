"use client";

import { useState, useEffect } from "react";

type SaveSessionPopupProps = {
    isOpen: boolean;
    onClose: () => void;
    defaultLabel: string;
    onSave: (label: string) => void;
};

export default function SaveSessionPopup({ isOpen, onClose, defaultLabel, onSave }: SaveSessionPopupProps) {
    const [label, setLabel] = useState(defaultLabel);

    useEffect(() => {
        if (isOpen) {
            setLabel(defaultLabel);
        }
    }, [isOpen, defaultLabel]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-80">
                <label className="block text-sm font-bold mb-2">Session Name:</label>
                <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                    <button onClick={() => onSave(label)} className="px-4 py-2 bg-gray-900 text-white rounded text-sm">Save</button>
                </div>
            </div>
        </div>
    );
}