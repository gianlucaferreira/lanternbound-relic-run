import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { startGame, type GameMode, type HUD } from "@/game/engine";
import potionSrc from "@/assets/sprite-potion.png";
import potionEmptySrc from "@/assets/sprite-potion-empty.png";

export function GamePage({ mode }: { mode: GameMode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<HUD | null>(null);
  const [run, setRun] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ref.current) return;
    setHud(null);
    return startGame(ref.current, setHud, mode);
  }, [run, mode]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <canvas key={run} ref={ref} className="block h-full w-full" />
      <div className="pointer-events-none absolute left-5 top-4 space-y-2">
        {hud && <div className="flex items-center">{Array.from({ length: hud.maxHp }).map((_, i) => <img className="h-12" key={i} src={i < hud.hp ? potionSrc : potionEmptySrc} />)}</div>}
        {hud && <p className="text-sm text-primary">Arma: {hud.weapon === "bow" ? "BESTA" : "LÂMINA"}</p>}
        {hud?.mode === "waves" && <div className="mt-2 rounded border border-primary/50 bg-background/80 px-3 py-2 text-sm text-primary"><strong>ONDA {hud.wave}</strong> · Inimigos restantes: {hud.enemiesRemaining}{hud.waveBreak > 0 && <div className="text-xs text-muted-foreground">Próxima onda em {Math.ceil(hud.waveBreak)}s · recolha os itens</div>}</div>}
        <p className="max-w-xs text-xs text-muted-foreground">WASD/setas para mover · Espaço ou clique para atacar · Q alterna a arma após encontrar a besta</p>
      </div>
      {hud && hud.status !== "play" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-sm">
          <h2 className="font-sans text-5xl tracking-widest text-primary">{hud.status === "win" ? "CAFÉ FOI ENCONTRADO" : "VOCÊ CAIU"}</h2>
          <p className="text-muted-foreground">{hud.status === "win" ? "Mas era descafeínado!" : "A masmorra muda a cada tentativa."}</p>
          <button onClick={() => setRun((r) => r + 1)} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">TENTAR DE NOVO</button>
          <button onClick={() => navigate({ to: "/" })} className="font-sans text-sm text-muted-foreground transition hover:text-primary">VOLTAR AO MENU</button>
        </div>
      )}
    </main>
  );
}
