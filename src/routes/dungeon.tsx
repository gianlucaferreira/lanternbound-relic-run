import { createFileRoute } from "@tanstack/react-router";
import { GamePage } from "@/components/GamePage";

export const Route = createFileRoute("/dungeon")({
  ssr: false,
  component: () => <GamePage mode="dungeon" />,
});
