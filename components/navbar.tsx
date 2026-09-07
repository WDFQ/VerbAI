"use client"

import Image from "next/image";
import MenuIcon from "../public/menu.svg";
import { useSidebar } from "@/components/ui/sidebar";
import { useStatus } from "@/contexts/statusContext";

export default function Navbar() {
	const { toggleSidebar } = useSidebar();
	const { status } = useStatus();

	return (
		<nav className="bg-deep-pink text-white h-15 grid grid-cols-[1fr_auto_1fr] items-center">

			{/* Menu button */}
			<button
				type="button"
				aria-label="Open the menu sidebar"
				className="cursor-pointer p-1 justify-self-start"
				onClick={toggleSidebar}
			>
				<Image src={MenuIcon} alt="Menu icon image" height={50} width={50} />
			</button>

			{/* Title drop */}
			<h1 className="font-playfair-display text-2xl font-bold justify-self-center">VerbAI</h1>

			{/* Status indicator */}
			<div className="justify-self-end pr-4">
				{status && (
					<div className="flex items-center gap-2" role="status" aria-live="polite">
						<span className="text-s font-playfair-display">{status}</span>
						<span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
					</div>
				)}
			</div>
		</nav>
	);
}