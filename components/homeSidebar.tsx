"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenuButton,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Plus, RotateCcwClock, Settings } from "lucide-react";
import { useTheme } from "@/contexts/themeContext";

/**
 * Renders the main navigation sidebar, including history and dark-mode controls.
 */
export function HomeSidebar() {
	const { theme, toggleTheme } = useTheme();
	return (
		<Sidebar>
			<SidebarHeader>
				<h1 className="font-playfair-display text-xl font-bold px-2">VerbAI</h1>
			</SidebarHeader>
			<SidebarContent>

				{/* Main buttons */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{/* New session button */}
							<SidebarMenuItem>
								<a href="/">
									<SidebarMenuButton className="cursor-pointer">
										<Plus />
										<span className="font-playfair-display text-md font-bold">
											New Session
										</span>
									</SidebarMenuButton>
								</a>
							</SidebarMenuItem>

							{/* History button */}
							<SidebarMenuItem>
								<Link href="/history">
									<SidebarMenuButton className="cursor-pointer">
										<RotateCcwClock />
										<span className="font-playfair-display text-md font-bold">
											History
										</span>
									</SidebarMenuButton>
								</Link>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Settings */}
				<Collapsible className="group/collapsible">
					<SidebarGroup>
						<SidebarGroupLabel render={<CollapsibleTrigger />} className="gap-2 cursor-pointer">
							<Settings />
							<h2 className="font-playfair-display text-lg font-bold">
								Settings
							</h2>
							<ChevronDown className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
						</SidebarGroupLabel>
						<CollapsibleContent>
							<div className="flex items-center justify-between gap-2 pl-10 pr-2 py-1.5">
								<label
									htmlFor="dark-mode-switch"
									className="font-playfair-display text-md font-bold"
								>
									Dark Mode
								</label>
								<Switch
									id="dark-mode-switch"
									checked={theme === "dark"}
									onCheckedChange={toggleTheme}
									className={"cursor-pointer"}
								/>
							</div>
						</CollapsibleContent>
					</SidebarGroup>
				</Collapsible>
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
