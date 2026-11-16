import jeffPortrait from "@/assets/characters/Jeff.png";
import kayaPortrait from "@/assets/characters/Kaya.png";

export type WeaponKind = "melee" | "bow";
export type CharacterDefinition = {
  id: string;
  name: string;
  title: string;
  weapon: WeaponKind;
  weaponLabel: string;
  portrait: string;
  sprite: "jeff" | "kaya";
};
export type CharacterProgress = { level: number; xp: number };

export const CHARACTERS: CharacterDefinition[] = [
  { id: "jeff", name: "JEFF JONES", title: "EXPLORADOR", weapon: "melee", weaponLabel: "LÂMINA", portrait: jeffPortrait, sprite: "jeff" },
  { id: "kaya", name: "KAYA BRYON", title: "INVENTORA", weapon: 'bow', weaponLabel: 'REVOLVER', portrait: kayaPortrait, sprite: 'kaya' }
];

const SELECTED_KEY = "lanternbound:selected-character";
const PROGRESS_KEY = "lanternbound:character-progress";
const defaultProgress: CharacterProgress = { level: 1, xp: 0 };
const isBrowser = typeof window !== "undefined";

export function getSelectedCharacterId(): string {
  if (!isBrowser) return CHARACTERS[0]!.id;
  const saved = window.localStorage.getItem(SELECTED_KEY);
  return CHARACTERS.some((character) => character.id === saved) ? saved! : CHARACTERS[0]!.id;
}

export function saveSelectedCharacter(id: string) {
  if (CHARACTERS.some((character) => character.id === id) && isBrowser) window.localStorage.setItem(SELECTED_KEY, id);
}

export function getCharacterProgress(id: string): CharacterProgress {
  if (!isBrowser) return defaultProgress;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, CharacterProgress>;
    const progress = saved[id];
    return progress && Number.isFinite(progress.level) && Number.isFinite(progress.xp) ? progress : defaultProgress;
  } catch { return defaultProgress; }
}

export function awardCharacterXp(id: string, amount = 1): CharacterProgress {
  const current = getCharacterProgress(id);
  const xp = current.xp + amount;
  const next = { level: current.level + Math.floor(xp / 10), xp: xp % 10 };
  if (isBrowser) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, CharacterProgress>;
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...saved, [id]: next }));
    } catch { /* Progress remains playable if storage is unavailable. */ }
  }
  return next;
}
