import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Maximize, Minimize, Pause } from "lucide-react";
import { startGame, type GameMode, type HUD } from "@/game/engine";
import potionSrc from "@/assets/sprite-potion.png";
import potionEmptySrc from "@/assets/sprite-potion-empty.png";
import heartItemSrc from "@/assets/sprite-heart.png";
import swordItemSrc from "@/assets/sprite-sword.png";
import scytheItemSrc from "@/assets/sprite-foice.png";
import brassKnucklesItemSrc from "@/assets/sprite-soco-ingles.png";
import hammerItemSrc from "@/assets/sprite-martelo.png";
import revolverItemSrc from "@/assets/sprite-revolver.png";
import crossbowItemSrc from "@/assets/sprite-crossbow.png";
import speedItemSrc from "@/assets/spirte-indicador-velocidade.png";
import relicItemSrc from "@/assets/sprite-cafe.png";
import guizoItemSrc from "@/assets/Guizo.png";
import lupasItemSrc from "@/assets/lupa.png";
import knifeItemSrc from "@/assets/faca-zhao.png";
import bookDropSrc from "@/assets/livro-drop.png";
import mobileAttackButtonMelee from "@/assets/mobile/botao-ataque-melee.png";
import mobileAttackButtonRanged from "@/assets/mobile/botao-ataque-ranged.png";
import mobileAttackButtonJosias from "@/assets/mobile/botao-ataque-josias.png";
import mobileChangeWeaponButton from "@/assets/mobile/troca-arma.png";
import mobileFullScreenButton from "@/assets/mobile/full-screen.png";
import pauseButton from "@/assets/mobile/pause.png";



import { CHARACTERS, awardCharacterXp, getCharacterProgress, getSelectedCharacterId } from "@/game/characters";
import { Item } from "@/game/types";

type ItemIcon = { kind: Item['kind'], label: string, src: string }

export function GamePage({ mode }: { mode: GameMode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const mobileKeysRef = useRef(new Set<string>());
  const skipWaveRef = useRef<(() => void) | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);
  const [hud, setHud] = useState<HUD | null>(null);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [run, setRun] = useState(0);
  const [characterId] = useState(getSelectedCharacterId);
  const character = CHARACTERS.find((candidate) => candidate.id === characterId) ?? CHARACTERS[0]!;
  const itemIcons: ItemIcon[] = [
    { kind: "heart", label: "Coração", src: heartItemSrc },
    { kind: "sword", label: "Arma corpo a corpo", src: character.id === "zhao" ? knifeItemSrc : character.id === "kaya" ? scytheItemSrc : character.id === "josias" ? brassKnucklesItemSrc : swordItemSrc },
    { kind: "boots", label: "Velocidade", src: speedItemSrc },
    { kind: "bow", label: "Arma à distância", src: character.id === "zhao" ? bookDropSrc : character.id === "kaya" ? revolverItemSrc : character.id === "josias" ? hammerItemSrc : crossbowItemSrc },
    { kind: "guizo", label: "Guizo", src: guizoItemSrc },
    { kind: "runa", label: "Runa", src: lupasItemSrc },
  ];
  const navigate = useNavigate();

  const setMobileKey = (key: string, pressed: boolean) => {
    const normalizedKey = key.toLowerCase();
    const keys = mobileKeysRef.current;
    if (pressed === keys.has(normalizedKey)) return;
    if (pressed) keys.add(normalizedKey);
    else keys.delete(normalizedKey);
    window.dispatchEvent(new KeyboardEvent(pressed ? "keydown" : "keyup", { key, bubbles: true, cancelable: true }));
  };

  const updateJoystick = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const threshold = bounds.width * 0.16;
    const next = new Set<string>();
    if (Math.abs(dx) > threshold) next.add(dx < 0 ? "a" : "d");
    if (Math.abs(dy) > threshold) next.add(dy < 0 ? "w" : "s");
    for (const key of ["w", "a", "s", "d"]) setMobileKey(key, next.has(key));
    const knob = joystickRef.current?.querySelector<HTMLElement>(".mobile-joystick-knob");
    if (knob) {
      const distance = Math.hypot(dx, dy);
      const maxDistance = bounds.width * 0.28;
      const scale = distance > maxDistance ? maxDistance / distance : 1;
      knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    }
  };


  const weaponImage = hud?.weapon === "bow" ? mobileAttackButtonRanged : characterId === "josias" ? mobileAttackButtonJosias : mobileAttackButtonMelee
  const resetJoystick = () => {
    for (const key of ["w", "a", "s", "d"]) setMobileKey(key, false);
    const knob = joystickRef.current?.querySelector<HTMLElement>(".mobile-joystick-knob");
    if (knob) knob.style.transform = "translate(0, 0)";
  };

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === ref.current?.parentElement);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    const game = ref.current?.parentElement;
    if (!game) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await game.requestFullscreen();
    } catch {
      // Fullscreen can be unavailable in some mobile browsers; the game still fills the viewport.
    }
  };

  useEffect(() => {
    if (!ref.current) return;
    setHud(null);
    setPaused(false);
    return startGame(ref.current, setHud, mode, setPaused, (skip) => { skipWaveRef.current = skip; }, character, getCharacterProgress(character.id), () => { awardCharacterXp(character.id); }, (resume) => { resumeRef.current = resume; });
  }, [run, mode, character]);

  return (
    <main className="game-page-shell relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <canvas key={run} ref={ref} className="block h-full w-full" />
      <button type="button" className="mobile-fullscreen-button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Sair da tela cheia" : "Ativar tela cheia"} title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
        <img src={mobileFullScreenButton} className="max-w-8 w-full" />
      </button>
      {hud?.status === "play" && !paused && <div className="mobile-game-controls" aria-label="Controles do jogo">
        <div
          ref={joystickRef}
          className="mobile-joystick"
          role="application"
          aria-label="Joystick para mover o personagem"
          onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); updateJoystick(event); }}
          onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateJoystick(event); }}
          onPointerUp={resetJoystick}
          onPointerCancel={resetJoystick}
          onLostPointerCapture={resetJoystick}
        ><span className="mobile-joystick-knob" /></div>
        <div className="mobile-action-buttons">
          <button type="button" className="mobile-action-button" aria-label="Atacar" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setMobileKey(" ", true); }} onPointerUp={() => setMobileKey(" ", false)} onPointerCancel={() => setMobileKey(" ", false)} onClick={(event) => { if (event.detail === 0) { setMobileKey(" ", true); setMobileKey(" ", false); } }}>
            <img src={weaponImage} alt="" className="max-w-20" />
          </button>
          <button type="button" className="mobile-action-button" aria-label="Trocar de arma" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setMobileKey("q", true); setMobileKey("q", false); }} onClick={(event) => { if (event.detail === 0) { setMobileKey("q", true); setMobileKey("q", false); } }}>
            <img src={mobileChangeWeaponButton} alt="" className="max-w-20" />
          </button>
        </div>
      </div>}
      <div className="pointer-events-none absolute left-5 top-4 space-y-2">
        {hud && <div className="flex space-x-2 items-center">{hud.status === "play" && !paused && <button type="button" className="mobile-pause-button pointer-events-auto" aria-label="Pausar jogo" title="Pausar jogo" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))}> <img src={pauseButton} className="max-w-8 w-full" /> </button>} {Array.from({ length: hud.maxHp }).map((_, i) => <img className="h-8" key={i} src={i < hud.hp ? potionSrc : potionEmptySrc} />)}</div>}
        {hud && <p className="text-sm text-primary">Arma: {character.weaponLabels[hud.weapon]}</p>}
        {hud && <p className="text-xs text-primary">{character.name} · NV. {getCharacterProgress(character.id).level}</p>}
      </div>
      {hud && <CounterItens itemIcons={itemIcons} hud={hud} />}
      <div className="pointer-events-none absolute right-5 top-4 space-y-2">
        {hud?.mode === "waves" && <div className="mt-2 rounded border border-primary/50 bg-background/80 px-3 py-2 text-sm text-primary"><strong>ONDA {hud.wave}</strong> · Inimigos restantes: {hud.enemiesRemaining}{hud.waveBreak > 0 && <><div className="text-xs text-muted-foreground">Próxima onda em {Math.ceil(hud.waveBreak)}s · recolha os itens</div><button type="button" onClick={() => skipWaveRef.current?.()} className="pointer-events-auto mt-2 rounded border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground">PULAR ESPERA</button></>}</div>}
      </div>
      <div className="pointer-events-none absolute right-5 top-32 space-y-2">
        {hud?.mode === "dungeon" && <p className="px-3 py-1 text-sm font-semibold text-primary">FASE {hud.phase} / {hud.phaseCount}</p>}
      </div>
      <div className="pointer-events-none absolute left-5 bottom-4 space-y-2">
        <p className="max-w-xs bottom-0 text-xs text-muted-foreground">WASD/setas para mover · Espaço ou clique para atacar · Q alterna entre as armas do personagem · ESC para pausar{mode === "waves" && " · T para pular a espera entre ondas"}</p>
      </div>
      {hud && hud.status !== "play" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-sm">
          <h2 className="font-sans text-5xl tracking-widest text-primary">{hud.status === "win" ? "CAFÉ FOI ENCONTRADO" : "VOCÊ CAIU"}</h2>
          <p className="text-muted-foreground">{hud.status === "win" ? "Mas era descafeínado!" : hud.mode === 'dungeon' ? "A masmorra muda a cada tentativa." : <p>Você chegou até a onda <strong className="text-yellow-300">{hud.wave}</strong></p>} </p>
          <button onClick={() => setRun((r) => r + 1)} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">DROGA!</button>
          <button onClick={() => navigate({ to: "/" })} className="font-sans text-sm text-muted-foreground transition hover:text-primary">VOLTAR AO MENU</button>
          {hud && <CounterItens itemIcons={itemIcons} hud={hud} />}
        </div>
      )}
      {paused && hud?.status === "play" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-background/85 p-6 text-center backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <h2 id="pause-title" className="font-sans text-5xl tracking-widest text-primary">JOGO PAUSADO</h2>
          <button autoFocus onClick={() => resumeRef.current?.()} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">CONTINUAR</button>
          <button onClick={() => setRun((r) => r + 1)} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">REINICIAR JOGO</button>
          <button onClick={() => navigate({ to: "/" })} className="font-sans text-sm text-muted-foreground transition hover:text-primary">VOLTAR AO MENU</button>
          {hud && <CounterItens itemIcons={itemIcons} hud={hud} />}
        </div>
      )}
    </main>
  );
}

function CounterItens({ itemIcons, hud }: { itemIcons: ItemIcon[], hud: HUD }) {
  return (
    <div className="mobile-item-counters pointer-events-none absolute right-5 bottom-4 flex max-w-64 flex-wrap gap-x-3 gap-y-1 rounded px-2 py-1.5" aria-label="Itens coletados durante a partida">
      {itemIcons.map(({ kind, label, src }) => <div key={kind} className="flex items-center gap-1" title={`${label}: ${hud.itemCounts[kind]}`} aria-label={`${label}: ${hud.itemCounts[kind]}`}>
        <img className="w-10 max-h-8 object-contain" src={src} alt="" />
        <span className="text-md font-title font-semibold tabular-nums text-primary">{hud.itemCounts[kind]}</span>
      </div>)}
    </div>
  )
}  
