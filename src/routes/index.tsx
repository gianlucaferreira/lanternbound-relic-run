import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { startGame, type GameMode, type HUD } from "@/game/engine";
import heroSprite from "@/assets/sprite-hero.png";
import coffeeSprite from "@/assets/sprite-cafe.png";
import potionSrc from "@/assets/sprite-potion.png";
import potionEmptySrc from "@/assets/sprite-potion-empty.png";
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Project Shudarga: A Quest For Coffee" },
      { name: "description", content: "Atravesse salas, derrote inimigos, colete itens e encontre o CAFÉ Ancestral no fim da masmorra." },
      { property: "og:title", content: "Project Shudarga: A Quest For Coffee" },
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
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<GameMode>("dungeon");
  useEffect(() => {
    if (!playing || !ref.current) return;
    setHud(null);
    return startGame(ref.current, setHud, mode);
  }, [run, playing, mode]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      {!playing ? (
        <section className="game-menu">
          <div className="menu-grain" aria-hidden="true" />
          <header className="menu-heading">
            <div className="menu-title-wrap">
              {/* <p className="menu-eyebrow">UMA AVENTURA EM PIXELS</p> */}
              <h1 className="font-title text-4xl tracking-widest text-primary text-center">Project <strong className="text-red-600">Shudarga</strong> <br /> <span className="font-sans">A Quest For Coffee</span></h1>
            </div>
            <button className="menu-coffee waves-menu-button" aria-label="Iniciar modo Waves" onClick={() => { setMode("waves"); setPlaying(true); }}>
              <span className="coffee-spark spark-one">✧</span>
              <img src={coffeeSprite} alt="" />
              <span className="waves-menu-label">WAVES</span>
              <span className="coffee-spark spark-two">✦</span>
            </button>
          </header>

          <div className="menu-content">
            <aside className="hero-card">
              <div className="hero-card-top"><span>HERÓI</span><span className="hero-level">LV. 01</span></div>
              <div className="hero-stage"><div className="hero-glow" /><img src={heroSprite} alt="Herói da aventura" /></div>
              <p className="hero-name">O AVENTUREIRO</p>
              <div className="hero-stats"><span>♥ ♥ ♥ ♥ ♥ ♥</span><small>PRONTO PARA A JORNADA</small></div>
              <button className="menu-ghost-button" disabled aria-disabled="true">TROCAR PERSONAGEM <span>⌁</span></button>
            </aside>

            <nav className="menu-actions" aria-label="Menu principal">
              <p className="menu-section-label">ESCOLHA SEU DESTINO</p>
              <button className="menu-action primary-action" onClick={() => { setMode("dungeon"); setPlaying(true); }}>
                <span className="action-icon">▶</span><span>Jogar</span><span className="action-arrow">↗</span>
              </button>
              <button className="menu-action" disabled aria-disabled="true">
                <span className="action-icon">⚔</span><span>Multiplayer</span><span className="coming-soon">EM BREVE</span>
              </button>
              <button className="menu-action" disabled aria-disabled="true">
                <span className="action-icon">✦</span><span>Loja</span><span className="coming-soon">EM BREVE</span>
              </button>
              <div className="menu-footer-actions">
                <button disabled aria-disabled="true">Créditos</button>
                <button disabled aria-disabled="true">Idioma <span>PT-BR⌄</span></button>
              </div>
            </nav>

            <aside className="relic-card">
              <div className="relic-frame"><img src={coffeeSprite} alt="Relíquia do café" /></div>
              <span className="relic-count">× 0</span>
              <span className="relic-label">DESCAFEÍNADO COLETADO</span>
              <div className="relic-divider" />
            </aside>
          </div>
          <footer className="menu-bottom"><span>PROJECT SHUDARGA</span><span>V. 1.0</span></footer>
        </section>
      ) : (
        <>
          <canvas key={run} ref={ref} className="block h-full w-full" />
          <div className="pointer-events-none absolute left-5 top-4 space-y-2">

            {hud && <div className="flex items-center">{Array.from({ length: hud.maxHp }).map((_, i) => <img className="h-12" key={i} src={i < hud.hp ? potionSrc : potionEmptySrc} />)}</div>}
            {/* {hud && <p className="text-sm text-muted-foreground">Dano {hud.dmg} · Salas {hud.rooms}/{hud.total}</p>} */}
            {hud && <p className="text-sm text-primary ">Arma: {hud.weapon === "bow" ? "BESTA" : "LÂMINA"}</p>}
            {hud?.mode === "waves" && <div className="mt-2 rounded border border-primary/50 bg-background/80 px-3 py-2 text-sm text-primary"><strong>ONDA {hud.wave}</strong> · Inimigos restantes: {hud.enemiesRemaining}{hud.waveBreak > 0 && <div className="text-xs text-muted-foreground">Próxima onda em {Math.ceil(hud.waveBreak)}s · recolha os itens</div>}</div>}
            <p className="max-w-xs text-xs text-muted-foreground">WASD/setas para mover · Espaço ou clique para atacar · Q alterna a arma após encontrar a besta</p>
          </div>
          {hud && hud.status !== "play" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-sm">
              <h2 className="font-sans text-5xl tracking-widest text-primary">{hud.status === "win" ? "CAFÉ FOI ENCONTRADO" : "VOCÊ CAIU"}</h2>
              <p className="text-muted-foreground">{hud.status === "win" ? "Mas era descafeínado!" : "A masmorra muda a cada tentativa."}</p>
              <button onClick={() => setRun((r) => r + 1)} className="rounded-md border border-primary px-6 py-2 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">TENTAR DE NOVO</button>
              <button onClick={() => setPlaying(false)} className="font-sans text-sm text-muted-foreground transition hover:text-primary">VOLTAR AO MENU</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
