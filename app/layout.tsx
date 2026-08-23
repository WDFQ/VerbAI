import type { Metadata } from "next";
import { Playfair_Display, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HomeSidebar } from "@/components/home-sidebar";
import Navbar from "@/components/navbar";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "VerbAI",
	description: "AI-Powered Translation App",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html className={`${playfairDisplay.variable} h-full antialiased`} lang="en">
			<body className="min-h-full flex flex-col">
				<SidebarProvider>
					<HomeSidebar />
					<div className="flex flex-col flex-1">
						<Navbar />
						<main className="flex-1">{children}</main>
					</div>
				</SidebarProvider>
			</body>
		</html>
	);
}
