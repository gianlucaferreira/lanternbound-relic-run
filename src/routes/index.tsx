import { createFileRoute, useNavigate } from "@tanstack/react-router";
import heroSprite from "@/assets/sprite-hero.png";
import coffeeSprite from "@/assets/sprite-cafe.png";
import characterImage from "@/assets/characters/Jeff.png";
export const Route = createFileRoute("/")({
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
  component: Menu,
});

function Menu() {
  const navigate = useNavigate();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <section className="game-menu">
        <div className="menu-grain" aria-hidden="true" />
        <header className="menu-heading">
          <div className="menu-title-wrap">
            <h1 className="font-title text-4xl tracking-widest text-primary text-center">Project <strong className="text-red-600">Shudarga</strong> <br /> <span className="font-sans">A Quest For Coffee</span></h1>
          </div>
          <button className="menu-coffee waves-menu-button" aria-label="Iniciar modo Waves" onClick={() => navigate({ to: "/waves" })}>
            <span className="coffee-spark spark-one">✧</span>
            <img src={coffeeSprite} alt="" />
            <span className="waves-menu-label">WAVES</span>
            <span className="coffee-spark spark-two">✦</span>
          </button>
        </header>

        <div className="menu-content">
          <aside className="hero-card">
            <div className="hero-card-top"><span>EXPLORADOR</span><span className="hero-level">LV. 01</span></div>
            <div className="hero-stage"><div className="hero-glow" /><img src={characterImage} alt="Herói da aventura" /></div>
            <p className="hero-name">JEFF JONES</p>
            {/* <div className="hero-stats"><span>♥ ♥ ♥ ♥ ♥ ♥</span><small>PRONTO PARA A JORNADA</small></div> */}
            <button className="menu-ghost-button" disabled aria-disabled="true">TROCAR PERSONAGEM <span>⌁</span></button>
          </aside>

          <nav className="menu-actions" aria-label="Menu principal">
            <p className="menu-section-label">ESCOLHA SEU DESTINO</p>
            <button className="menu-action primary-action" onClick={() => navigate({ to: "/jogar" })}>
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
    </main>
  );
}
