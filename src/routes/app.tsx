import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/app/Shell";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "ReconPilot" }] }),
  component: Shell,
});
