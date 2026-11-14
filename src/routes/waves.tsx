import { createFileRoute } from "@tanstack/react-router";
import { GamePage } from "@/components/GamePage";

export const Route = createFileRoute("/waves")({
  ssr: false,
  component: () => <GamePage mode="waves" />,
});
