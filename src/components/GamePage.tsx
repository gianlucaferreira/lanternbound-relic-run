import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { startGame, type GameMode, type HUD } from "@/game/engine";
import potionSrc from "@/assets/sprite-potion.png";
import potionEmptySrc from "@/assets/sprite-potion-empty.png";
import { CHARACTERS, awardCharacterXp, getCharacterProgress, getSelectedCharacterId } from "@/game/characters";

export function GamePage({ mode }: { mode: GameMode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const skipWaveRef = useRef<(() => void) | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);
  const [hud, setHud] = useState<HUD | null>(null);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const [characterId] = useState(getSelectedCharacterId);
  const character = CHARACTERS.find((candidate) => candidate.id === characterId) ?? CHARACTERS[0]!;
  const navigate = useNavigate();

  useEffect(() => {
    if (!ref.current) return;
    setHud(null);
    setPaused(false);
    return startGame(ref.current, setHud, mode, setPaused, (skip) => { skipWaveRef.current = skip; }, character, getCharacterProgress(character.id), () => { awardCharacterXp(character.id); }, (resume) => { resumeRef.current = resume; });
  }, [run, mode, character]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <canvas key={run} ref={ref} className="block h-full w-full" />
      <div className="pointer-events-none absolute left-5 top-4 space-y-2">
        {hud && <div className="flex space-x-2 items-center">{Array.from({ length: hud.maxHp }).map((_, i) => <img className="h-8" key={i} src={i < hud.hp ? potionSrc : potionEmptySrc} />)}</div>}
        {hud && <p className="text-sm text-primary">Arma: {character.weaponLabels[hud.weapon]}</p>}
        {hud && <p className="text-xs text-primary">{character.name} · NV. {getCharacterProgress(character.id).level}</p>}
      </div>
      <div className="pointer-events-none absolute right-5 top-4 space-y-2">
        {hud?.mode === "waves" && <div className="mt-2 rounded border border-primary/50 bg-background/80 px-3 py-2 text-sm text-primary"><strong>ONDA {hud.wave}</strong> · Inimigos restantes: {hud.enemiesRemaining}{hud.waveBreak > 0 && <><div className="text-xs text-muted-foreground">Próxima onda em {Math.ceil(hud.waveBreak)}s · recolha os itens</div><button type="button" onClick={() => skipWaveRef.current?.()} className="pointer-events-auto mt-2 rounded border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground">PULAR ESPERA</button></>}</div>}
      </div>
      <div className="pointer-events-none absolute left-5 bottom-4 space-y-2">
        <p className="max-w-xs bottom-0 text-xs text-muted-foreground">WASD/setas para mover · Espaço ou clique para atacar · Q alterna entre as armas do personagem · ESC para pausar{mode === "waves" && " · T para pular a espera entre ondas"}</p>
      </div>
      {hud && hud.status !== "play" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-sm">
          <h2 className="font-sans text-5xl tracking-widest text-primary">{hud.status === "win" ? "CAFÉ FOI ENCONTRADO" : "VOCÊ CAIU"}</h2>
          <p className="text-muted-foreground">{hud.status === "win" ? "Mas era descafeínado!" : hud.mode === 'dungeon' ? "A masmorra muda a cada tentativa." : ''}</p>
          <button onClick={() => setRun((r) => r + 1)} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">DROGA!</button>
          <button onClick={() => navigate({ to: "/" })} className="font-sans text-sm text-muted-foreground transition hover:text-primary">VOLTAR AO MENU</button>
        </div>
      )}
      {paused && hud?.status === "play" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-background/85 p-6 text-center backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <h2 id="pause-title" className="font-sans text-5xl tracking-widest text-primary">JOGO PAUSADO</h2>
          <button autoFocus onClick={() => resumeRef.current?.()} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">CONTINUAR</button>
          <button onClick={() => setRun((r) => r + 1)} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">REINICIAR JOGO</button>
          <button onClick={() => navigate({ to: "/" })} className="font-sans text-sm text-muted-foreground transition hover:text-primary">VOLTAR AO MENU</button>
        </div>
      )}
    </main>
  );
}
