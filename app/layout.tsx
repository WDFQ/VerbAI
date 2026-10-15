import type { Metadata } from "next";
import { Cairo, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HomeSidebar } from "@/components/homeSidebar";
import Navbar from "@/components/navbar";
import { StatusProvider } from "@/contexts/statusContext";
import { ThemeProvider } from "@/contexts/themeContext";

const cairo = Cairo({
	variable: "--font-cairo-loaded",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "VerbAI",
	description: "AI-Powered Translation App",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			className={`${cairo.variable} font-sans h-full antialiased`}
			lang="en"
			suppressHydrationWarning
		>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var storedTheme=localStorage.getItem("theme");if(storedTheme==="dark"){document.documentElement.classList.add("dark")}}catch(error){}})()`,
					}}
				/>
			</head>
			<body className="h-screen flex flex-col overflow-hidden">
				<ThemeProvider>
					<StatusProvider>
						<SidebarProvider defaultOpen={false}>
							<HomeSidebar />
							<div className="flex flex-col flex-1 min-h-0">
								<Navbar />
								<main className="flex-1 min-h-0">{children}</main>
							</div>
						</SidebarProvider>
					</StatusProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
