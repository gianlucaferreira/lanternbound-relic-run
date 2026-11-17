import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CHARACTERS, getCharacterProgress, saveSelectedCharacter, type CharacterId } from "@/game/characters";

export function CharacterSelectModal({ currentId, onClose, onSelect }: { currentId: CharacterId; onClose: () => void; onSelect: (id: CharacterId) => void }) {
  const [index, setIndex] = useState(Math.max(0, CHARACTERS.findIndex((character) => character.id === currentId)));
  const character = CHARACTERS[index]!;
  const progress = getCharacterProgress(character.id);
  const move = (direction: number) => setIndex((value) => (value + direction + CHARACTERS.length) % CHARACTERS.length);
  const choose = () => { saveSelectedCharacter(character.id); onSelect(character.id); onClose(); };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="character-select-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="relative w-full max-w-md rounded-xl border border-primary/50 bg-background p-6 text-center shadow-2xl">
      <button className="absolute right-3 top-3 rounded p-2 text-muted-foreground hover:text-primary" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
      <p className="text-xs tracking-[0.25em] text-primary">SELEÇÃO DE PERSONAGEM</p>
      <h2 id="character-select-title" className="mt-2 font-title text-2xl tracking-widest">ESCOLHA SEU HERÓI</h2>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button onClick={() => move(-1)} aria-label="Personagem anterior" className="rounded-full border border-primary/50 p-3 text-primary hover:bg-primary/10"><ChevronLeft /></button>
        <div className="flex h-56 w-56 flex-col items-center justify-center rounded-lg border border-primary/20 bg-black/20">
          <img src={character.portrait} alt={character.name} className="h-40 max-w-[80%] object-contain drop-shadow-[0_0_18px_rgba(255,180,70,0.25)]" />
          <span className="mt-2 text-xs tracking-widest text-muted-foreground">{character.title}</span>
        </div>
        <button onClick={() => move(1)} aria-label="Próximo personagem" className="rounded-full border border-primary/50 p-3 text-primary hover:bg-primary/10"><ChevronRight /></button>
      </div>
      <h3 className="mt-4 font-title text-xl tracking-widest text-primary">{character.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Armas: {character.weaponLabels.melee} e {character.weaponLabels.bow} · Nível {progress.level}</p>
      <p className="mt-1 text-xs text-muted-foreground">Experiência: {progress.xp}/10 · Derrote inimigos para evoluir</p>
      <div className="mt-5 flex justify-center gap-1" aria-label={`Personagem ${index + 1} de ${CHARACTERS.length}`}>{CHARACTERS.map((item, itemIndex) => <span key={item.id} className={`h-1.5 w-6 rounded-full ${itemIndex === index ? "bg-primary" : "bg-muted"}`} />)}</div>
      {character.available ? <button onClick={choose} className="mt-6 w-full rounded-md border border-primary px-6 py-3 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">SELECIONAR PERSONAGEM</button> : <button onClick={choose} disabled className="mt-6 w-full cursor-not-allowed rounded-md border border-primary px-6 py-3 font-sans tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">EM BREVE</button>}
    </section>
  </div>;
}
