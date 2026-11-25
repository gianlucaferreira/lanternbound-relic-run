import jeffPortrait from "@/assets/characters/Jeff.png";
import kayaPortrait from "@/assets/characters/Kaya.png";
import josiasPortrait from "@/assets/characters/Josias-po.png";
import zhaoPortrait from "@/assets/characters/Zhao.png";
import kairoPortrait from "@/assets/characters/Kairo.png";
import misterPortrait from "@/assets/characters/Mister.png";
import ayamePortrait from "@/assets/characters/Ayame.png";
import zhaoDefaultSprite from "@/assets/characters/zhao-padrao.png";
import zhaoKnifeSprite from "@/assets/characters/zhao-faca.png";
import zhaoBookAttackSprite from "@/assets/characters/zhao-ataque-livro.png";
import bookProjectileSprite from "@/assets/livro-projetil.png";
import bookDropSprite from "@/assets/livro-drop.png";

import jeffSprite from "@/assets/characters/Jeff-espada-1.png";
import jeffAttackSprite from "@/assets/characters/Jeff-espada-2.png";
import jeffRangedSprite from "@/assets/characters/Jeff-crossbow.png";
import kayaMeleeSprite from "@/assets/characters/Kaya-Foice.png";
import kayaAttackSprite from "@/assets/characters/Kaya-Foice-2.png";
import kayaRangedSprite from "@/assets/characters/Kaya-Pistola.png";

import josiasSprite from "@/assets/characters/Josias.png";
import josiasAttackSprite from "@/assets/characters/Josias-2.png";
import josiasRangedSprite from "@/assets/characters/Josias-Martelo.png";
import josiasRangedAttackSprite from "@/assets/characters/Josias-Martelo-2.png";

import slimeSprite from "@/assets/sprite-slime.png";
import batSprite from "@/assets/sprite-bat.png";
import bossSprite from "@/assets/sprite-boss.png";
import bishopSprite from "@/assets/villains/Bispo.png";
import crossProjectileSprite from "@/assets/Cruz-projetil.png";
import orkSprite from "@/assets/ork.png";
import crossbowSprite from "@/assets/sprite-crossbow.png";
import arrowSprite from "@/assets/sprite-arrow.png";
import silverProjectileSprite from "@/assets/projetil-dourado.webp";
import goldenProjectileSprite from "@/assets/projetil-dourado.webp";

export type WeaponKind = "melee" | "bow";
export type CharacterId = "jeff" | "kaya" | "josias" | 'zhao' | 'kairo' | 'mister' | 'ayame';
export type EnemyId = "slime" | "bat" | "boss" | "bishop" | "ork";
export type CharacterDefinition = {
  id: CharacterId;
  name: string;
  title: string;
  weapon: WeaponKind;
  weaponLabels: Record<WeaponKind, string>;
  portrait: string;
  available: boolean,
  playable: boolean;
  stats: { hp: number; damage: number; speed: number };
  sprites: { melee: string; ranged: string; attack: string, rangedAttack?: string, projectile: string };
};
export type CharacterProgress = { level: number; xp: number };
export type EnemyDefinition = {
  id: EnemyId;
  name: string;
  sprite: string;
  hp: number;
  speed: number;
  radius: number;
  ranged: boolean;
  contactDamage: number;
};
export type CharacterState = { hp: number; maxHp: number; dmg: number; spd: number; weapon: WeaponKind; hasSecondaryWeapon: boolean };
export type EnemyState = { x: number; y: number; hp: number; max: number; spd: number; r: number; kind: EnemyId; hit: number; shotCd: number; moveT: number; attackT?: number; jumpX?: number; jumpY?: number; jumpDx?: number; jumpDy?: number };

export const WEAPONS: Record<WeaponKind, { id: WeaponKind; name: string; label: string; sprite: string; projectile: string }> = {
  melee: { id: "melee", name: "Lâmina", label: "LÂMINA", sprite: jeffSprite, projectile: "" },
  bow: { id: "bow", name: "Besta", label: "BESTA", sprite: crossbowSprite, projectile: arrowSprite },
};

export const CHARACTERS: CharacterDefinition[] = [
  { id: "jeff", available: true, name: "JEFF JONES", title: "EXPLORADOR", weapon: "melee", weaponLabels: { melee: "LÂMINA", bow: "BESTA" }, portrait: jeffPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: jeffSprite, ranged: jeffRangedSprite, attack: jeffAttackSprite, projectile: '' } },
  { id: "kaya", available: true, name: "KAYA BRYON", title: "INVENTORA", weapon: "bow", weaponLabels: { melee: "FOICE", bow: "REVÓLVER" }, portrait: kayaPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: kayaMeleeSprite, ranged: kayaRangedSprite, attack: kayaAttackSprite, projectile: '' } },
  { id: "josias", available: true, name: "JOSIAS ESCARIOTES", title: "LUTADOR", weapon: "melee", weaponLabels: { melee: "SOCO", bow: "MARTELO" }, portrait: josiasPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, rangedAttack: josiasRangedAttackSprite, projectile: '' } },
  { id: 'zhao', available: true, name: 'ZHAO YING YUE', title: "REPÓRTER", weapon: 'bow', weaponLabels: { melee: 'FACA', bow: 'LIVRO' }, portrait: zhaoPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: zhaoKnifeSprite, ranged: zhaoDefaultSprite, attack: zhaoKnifeSprite, rangedAttack: zhaoBookAttackSprite, projectile: bookProjectileSprite } },

  { id: 'kairo', available: false, name: 'KAIRO HENRIQUE ARMANDO FILHO', title: "PROGRAMADOR", weapon: 'melee', weaponLabels: { melee: 'CALMA', bow: 'CALMA' }, portrait: kairoPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, projectile: '' } },
  { id: 'mister', available: false, name: 'MISTER M', title: "ILUSIONISTA", weapon: 'melee', weaponLabels: { melee: 'CALMA', bow: 'CALMA' }, portrait: misterPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, projectile: '' } },
  { id: 'ayame', available: false, name: 'AYAME KURENAI', title: "ARTISTA", weapon: 'bow', weaponLabels: { melee: 'CALMA', bow: 'CALMA' }, portrait: ayamePortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, projectile: '' } },
];


export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  slime: { id: "slime", name: "Slime", sprite: slimeSprite, hp: 4, speed: 0.65, radius: 0.33, ranged: false, contactDamage: 1 },
  bat: { id: "bat", name: "Morcego", sprite: batSprite, hp: 2, speed: 0, radius: 0.52, ranged: true, contactDamage: 1 },
  boss: { id: "boss", name: "Luke", sprite: bossSprite, hp: 30, speed: 1.7, radius: 0.5, ranged: false, contactDamage: 3 },
  bishop: { id: "bishop", name: "O Bispo", sprite: bishopSprite, hp: 30, speed: 1.7, radius: 0.5, ranged: false, contactDamage: 1 },
  ork: { id: "ork", name: "Ork", sprite: orkSprite, hp: 12, speed: 0, radius: 0.58, ranged: false, contactDamage: 1 },
};

export const CHARACTER_SPRITES = { silverProjectile: silverProjectileSprite, goldenProjectile: goldenProjectileSprite, bookDrop: bookDropSprite, crossProjectile: crossProjectileSprite };

export function createCharacterState(character: CharacterDefinition): CharacterState {
  return { hp: character.stats.hp, maxHp: character.stats.hp, dmg: character.stats.damage, spd: character.stats.speed, weapon: character.weapon, hasSecondaryWeapon: true };
}

export function createEnemy(id: EnemyId, x: number, y: number, overrides: Partial<Pick<EnemyState, "hp" | "spd">> = {}): EnemyState {
  const definition = ENEMIES[id];
  const hp = overrides.hp ?? definition.hp;
  return { x, y, hp, max: hp, spd: overrides.spd ?? definition.speed, r: definition.radius, kind: id, hit: 0, shotCd: 0, moveT: 0 };
}

export function getCharacterSprite(character: CharacterDefinition | undefined, weapon: WeaponKind, attacking = false): string {
  const selected = character ?? CHARACTERS[0]!;
  if (weapon === "bow") return attacking ? selected.sprites.rangedAttack ?? selected.sprites.ranged : selected.sprites.ranged;
  return attacking ? selected.sprites.attack : selected.sprites.melee;
}

const SELECTED_KEY = "lanternbound:selected-character";
const PROGRESS_KEY = "lanternbound:character-progress";
const defaultProgress: CharacterProgress = { level: 1, xp: 0 };
const isBrowser = typeof window !== "undefined";

export function getSelectedCharacterId(): CharacterId {
  if (!isBrowser) return CHARACTERS[0]!.id;
  const saved = window.localStorage.getItem(SELECTED_KEY);
  return CHARACTERS.some((character) => character.id === saved && character.playable) ? saved as CharacterId : CHARACTERS.find((character) => character.playable)!.id;
}

export function saveSelectedCharacter(id: string) {
  if (CHARACTERS.some((character) => character.id === id && character.playable) && isBrowser) window.localStorage.setItem(SELECTED_KEY, id);
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
