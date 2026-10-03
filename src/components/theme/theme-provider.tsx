"use client";

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
} from "react";
import { themeInitScript } from "./theme-init-script";

export { themeInitScript };

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "autopayze-theme";

type ThemeContextValue = {
	preference: ThemePreference;
	resolvedTheme: ResolvedTheme;
	setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function getStoredPreference(): ThemePreference {
	if (typeof window === "undefined") return "system";
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark" || stored === "system") {
		return stored;
	}
	return "system";
}

function applyThemeClass(theme: ResolvedTheme) {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", theme === "dark");
}

function subscribeToTheme(callback: () => void) {
	if (typeof window === "undefined") return () => {};

	const mql = window.matchMedia("(prefers-color-scheme: dark)");
	const handleStorage = (event: StorageEvent) => {
		if (event.key === STORAGE_KEY) callback();
	};
	const handleThemeChange = () => callback();

	window.addEventListener("storage", handleStorage);
	window.addEventListener("autopayze-theme-change", handleThemeChange);
	mql.addEventListener("change", handleThemeChange);

	return () => {
		window.removeEventListener("storage", handleStorage);
		window.removeEventListener("autopayze-theme-change", handleThemeChange);
		mql.removeEventListener("change", handleThemeChange);
	};
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const preference = useSyncExternalStore<ThemePreference>(
		subscribeToTheme,
		getStoredPreference,
		() => "system",
	);
	const resolvedTheme: ResolvedTheme =
		preference === "system" ? getSystemTheme() : preference;

	useEffect(() => {
		const id = window.setTimeout(() => {
			applyThemeClass(resolvedTheme);
		}, 0);
		return () => window.clearTimeout(id);
	}, [resolvedTheme]);

	const setPreference = (next: ThemePreference) => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, next);
			window.dispatchEvent(new Event("autopayze-theme-change"));
		}
	};

	const value = useMemo<ThemeContextValue>(
		() => ({ preference, resolvedTheme, setPreference }),
		[preference, resolvedTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
