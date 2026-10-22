"use client";
import { createContext, useContext, useLayoutEffect, useState, ReactNode } from "react";

const THEME_STORAGE_KEY = "theme";

type Theme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
	if (typeof window === "undefined") {
		return "light";
	}
	try {
		const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (storedTheme === "dark") {
			return "dark";
		}
		return "light";
	} catch {
		return "light";
	}
}

function applyThemeToDocument(theme: Theme) {
	const rootElement = document.documentElement;
	if (theme === "dark") {
		rootElement.classList.add("dark");
	} else {
		rootElement.classList.remove("dark");
	}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(readStoredTheme);

	// Re-applies the class on every theme change, and also re-applies it after
	// React's Strict Mode dev remount clears attributes the inline bootstrap
	// script set on <html> before hydration.
	useLayoutEffect(function syncThemeClass() {
		applyThemeToDocument(theme);
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			// localStorage may be unavailable (private browsing, disabled storage); ignore.
		}
	}, [theme]);

	function toggleTheme() {
		if (theme === "dark") {
			setTheme("light");
		} else {
			setTheme("dark");
		}
	}

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
