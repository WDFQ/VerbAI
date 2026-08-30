"use client";

import { useState } from "react";
import Image from "next/image";
import CloseIcon from "../public/close.svg";

type LanguageSelectorProps = {
    language: string | null;
    onSelect: (lang: string) => void;
    options: string[];
};

export default function LanguageSelector({ language, onSelect, options }: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded-full bg-gray-700 text-white text-sm">
                {language ?? "Choose language..."}
            </button>

            <div className={`fixed inset-0 bg-gray-200 flex flex-col z-50 transform transition-transform duration-400 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Header */}
                <div className="bg-gray-700 text-white text-sm font-medium px-4 py-3">
                    Choose language
                </div>

                {/* List of languages */}
                <div className="flex-1 overflow-y-auto">
                    {options.map((option) => (
                        <button key={option} onClick={() => { onSelect(option); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-300">
                            {option}
                        </button>
                    ))}
                </div>

                {/* Close button */}
                <div className="flex justify-center pb-6 pt-2">
                    <button onClick={() => setIsOpen(false)} className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                        <Image src={CloseIcon} alt="Close" height={20} width={20} className="invert"/>
                    </button>
                </div>
            </div>
            
        </>
    );
}