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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, RotateCcwClock } from "lucide-react";

export function HomeSidebar() {
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
								<SidebarMenuButton>
									<Plus />
									<span className="font-playfair-display text-md font-bold">
										New Session
									</span>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{/* History button */}
							<SidebarMenuItem>
								<SidebarMenuButton>
									<RotateCcwClock />
									<span className="font-playfair-display text-md font-bold">
										History
									</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Settings */}
				<Collapsible className="group/collapsible">
					<SidebarGroup>
						<SidebarGroupLabel render={<CollapsibleTrigger />}>
							<h2 className="font-playfair-display text-lg font-bold px-2">
								Settings
							</h2>
							<ChevronDown className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
						</SidebarGroupLabel>
						<CollapsibleContent>
							<p>settings 1</p>
							<p>settings 2</p>
						</CollapsibleContent>
					</SidebarGroup>
				</Collapsible>
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
