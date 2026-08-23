"use client"

import Image from "next/image";
import MenuIcon from "../public/menu.svg";
import BookmarkIcon from "../public/bookmark.svg";
import { useSidebar } from "@/components/ui/sidebar";

export default function Navbar() {
	const { toggleSidebar } = useSidebar();

	return (
		<nav className="bg-deep-pink text-white h-15 flex flex-row items-center justify-between">

			{/* Menu button */}
			<button
				type="button"
				aria-label="Open the menu sidebar"
				className="cursor-pointer p-1"
				onClick={toggleSidebar}
			>
				<Image src={MenuIcon} alt="Menu icon image" height={50} width={50} />
			</button>

			{/* Title drop */}
			<h1 className="font-playfair-display text-2xl font-bold">VerbAI</h1>

			{/* Save session button */}
			<button
				type="button"
				aria-label="Saves the current session"
				className="cursor-pointer p-1 flex flex-row items-center"
			>
				<Image src={BookmarkIcon} alt="Save icon image" height={45} width={45} />
			</button>
		</nav>
	);
}