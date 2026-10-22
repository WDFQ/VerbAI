"use client"

import Image from "next/image";
import MenuIcon from "../public/menu.svg";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Renders the app's top navigation bar and a button for toggling the sidebar.
 */
export default function Navbar() {
	const { toggleSidebar } = useSidebar();

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
		</nav>
	);
}