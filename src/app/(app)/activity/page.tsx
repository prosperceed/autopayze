import { Activity } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ActivityPage() {
	return (
		<PlaceholderPage
			icon={Activity}
			title="Activity"
			description="A full history of payments, schedules and airdrops on your account."
			emptyTitle="No activity yet"
			emptyDescription="Every transaction Autopayze sends on your behalf will be logged here, with a timestamp and status."
		/>
	);
}
