import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { startGame, type HUD } from "@/game/engine";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cripta do Cálice — Roguelike 2.5D" },
      { name: "description", content: "Atravesse salas, derrote inimigos, colete itens e encontre o Cálice Ancestral no fim da masmorra." },
      { property: "og:title", content: "Cripta do Cálice — Roguelike 2.5D" },
      { property: "og:description", content: "Um roguelike isométrico de masmorra jogável no navegador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

function Game() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<HUD | null>(null);
  const [run, setRun] = useState(0);
  useEffect(() => (ref.current ? startGame(ref.current, setHud) : undefined), [run]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <canvas key={run} ref={ref} className="block h-full w-full" />
      <div className="pointer-events-none absolute left-5 top-4 space-y-2">
        <h1 className="font-display text-2xl tracking-widest text-primary">CRIPTA DO CÁLICE</h1>
        {hud && (
          <div className="flex gap-1 text-xl">
            {Array.from({ length: hud.maxHp }).map((_, i) => (
              <span key={i} className={i < hud.hp ? "text-destructive" : "text-muted-foreground"}>♥</span>
            ))}
          </div>
        )}
        {hud && <p className="text-sm text-muted-foreground">Dano {hud.dmg} · Salas {hud.rooms}/{hud.total}</p>}
        <p className="text-xs text-muted-foreground">WASD/setas para mover · Espaço ou clique para atacar</p>
      </div>
      {hud && hud.status !== "play" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-sm">
          <h2 className="font-display text-5xl tracking-widest text-primary">
            {hud.status === "win" ? "CÁLICE ENCONTRADO" : "VOCÊ CAIU"}
          </h2>
          <p className="text-muted-foreground">
            {hud.status === "win" ? "A masmorra foi conquistada." : "A masmorra muda a cada tentativa."}
          </p>
          <button onClick={() => setRun((r) => r + 1)} className="rounded-md border border-primary px-6 py-2 font-display tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">
            NOVA DESCIDA
          </button>
        </div>
      )}
    </main>
  );
}
