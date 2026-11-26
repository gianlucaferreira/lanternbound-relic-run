import jeffPortrait from "@/assets/characters/Jeff/Portrait/Jeff.png";
import kayaPortrait from "@/assets/characters/Kaya/Portrait/Kaya.png";
import josiasPortrait from "@/assets/characters/Josias/Portrait/Josias-po.png";
import zhaoPortrait from "@/assets/characters/Zhao/Portrait/Zhao.png";
import kairoPortrait from "@/assets/characters/Kairo/Kairo.png";
import misterPortrait from "@/assets/characters/MisterM/Mister.png";
import ayamePortrait from "@/assets/characters/Ayame/Ayame.png";
import eclidesPortrait from "@/assets/characters/Eclides/Portrait/Eclides.png";
import eclidesPistolSprite from "@/assets/characters/Eclides/Sprites/Idle-pistola.png";
import eclidesBombSprite from "@/assets/characters/Eclides/Sprites/Idle-mina.png";
import eclidesThrowSprite from "@/assets/characters/Eclides/Sprites/Pegando-bomba.png";
import eclidesBombProjectile from "@/assets/characters/Eclides/Itens/Bomba.png";
import zhaoDefaultSprite from "@/assets/characters/Zhao/Sprites/zhao-padrao.png";
import zhaoKnifeSprite from "@/assets/characters/Zhao/Sprites/zhao-faca.png";
import zhaoBookAttackSprite from "@/assets/characters/Zhao/Sprites/zhao-ataque-livro.png";
import bookProjectileSprite from "@/assets/characters/Zhao/Itens/livro-projetil.png";
import bookDropSprite from "@/assets/characters/Zhao/Itens/livro-drop.png";

import jeffSprite from "@/assets/characters/Jeff/Sprites/Jeff-espada-1.png";
import jeffAttackSprite from "@/assets/characters/Jeff/Sprites/Jeff-espada-2.png";
import jeffRangedSprite from "@/assets/characters/Jeff/Sprites/Jeff-crossbow.png";
import kayaMeleeSprite from "@/assets/characters/Kaya/Sprites/Kaya-Foice.png";
import kayaAttackSprite from "@/assets/characters/Kaya/Sprites/Kaya-Foice-2.png";
import kayaRangedSprite from "@/assets/characters/Kaya/Sprites/Kaya-Pistola.png";

import josiasSprite from "@/assets/characters/Josias/Sprites/Josias.png";
import josiasAttackSprite from "@/assets/characters/Josias/Sprites/Josias-2.png";
import josiasRangedSprite from "@/assets/characters/Josias/Sprites/Josias-Martelo.png";
import josiasRangedAttackSprite from "@/assets/characters/Josias/Sprites/Josias-Martelo-2.png";

import slimeSprite from "@/assets/villains/Comum/sprite-slime.png";
import batSprite from "@/assets/villains/Comum/sprite-bat.png";
import bossSprite from "@/assets/villains/Boss/Luke/Sprite/Luke.png";
import bishopSprite from "@/assets/villains/Boss/Bispo/Sprite/Bispo.png";
import crossProjectileSprite from "@/assets/villains/Boss/Bispo/Item/Cruz-projetil.png";
import orkSprite from "@/assets/villains/Comum/ork.png";
import crossbowSprite from "@/assets/characters/Jeff/Itens/sprite-crossbow.png";
import arrowSprite from "@/assets/characters/Jeff/Itens/sprite-arrow.png";
import silverProjectileSprite from "@/assets/projetil-dourado.webp";
import goldenProjectileSprite from "@/assets/projetil-dourado.webp";

export type WeaponKind = "primary" | "special";
export type WeaponStyle = "melee" | "ranged";
export type CharacterId = "jeff" | "kaya" | "josias" | 'zhao' | 'kairo' | 'mister' | 'ayame' | 'eclides';
export type EnemyId = "slime" | "bat" | "boss" | "bishop" | "ork";
export type CharacterDefinition = {
  id: CharacterId;
  name: string;
  title: string;
  primaryWeapon: string;
  specialWeapon: string;
  weaponStyles: Record<WeaponKind, WeaponStyle>;
  weaponLabels: Record<WeaponKind, string>;
  portrait: string;
  available: boolean,
  playable: boolean;
  stats: { hp: number; damage: number; speed: number };
  sprites: { melee: string; ranged: string; attack: string, rangedAttack?: string, projectile: string };
  bombProjectile?: string;
  specialSprite?: string;
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

export const WEAPONS = {
  ranged: { name: "Besta", label: "BESTA", sprite: crossbowSprite, projectile: arrowSprite },
};

export const CHARACTERS: CharacterDefinition[] = [
  { id: "jeff", available: true, name: "JEFF JONES", title: "EXPLORADOR", primaryWeapon: "ESPADA", specialWeapon: "BESTA", weaponStyles: { primary: "melee", special: "ranged" }, weaponLabels: { primary: "ESPADA", special: "BESTA" }, portrait: jeffPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: jeffSprite, ranged: jeffRangedSprite, attack: jeffAttackSprite, projectile: '' } },
  { id: "kaya", available: true, name: "KAYA BRYON", title: "INVENTORA", primaryWeapon: "PISTOLA", specialWeapon: "FOICE", weaponStyles: { primary: "ranged", special: "melee" }, weaponLabels: { primary: "PISTOLA", special: "FOICE" }, portrait: kayaPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: kayaMeleeSprite, ranged: kayaRangedSprite, attack: kayaAttackSprite, projectile: '' } },
  { id: "josias", available: true, name: "JOSIAS ESCARIOTES", title: "LUTADOR", primaryWeapon: "SOCO", specialWeapon: "MARTELO", weaponStyles: { primary: "melee", special: "melee" }, weaponLabels: { primary: "SOCO", special: "MARTELO" }, portrait: josiasPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, rangedAttack: josiasRangedAttackSprite, projectile: '' } },
  { id: 'zhao', available: true, name: 'ZHAO YING YUE', title: "REPÓRTER", primaryWeapon: "LIVRO", specialWeapon: "FACA", weaponStyles: { primary: "ranged", special: "melee" }, weaponLabels: { primary: 'LIVRO', special: 'FACA' }, portrait: zhaoPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: zhaoKnifeSprite, ranged: zhaoDefaultSprite, attack: zhaoKnifeSprite, rangedAttack: zhaoBookAttackSprite, projectile: bookProjectileSprite } },

  { id: 'kairo', available: false, name: 'KAIRO HENRIQUE ARMANDO FILHO', title: "PROGRAMADOR", primaryWeapon: "CALMA", specialWeapon: "CALMA", weaponStyles: { primary: "melee", special: "ranged" }, weaponLabels: { primary: 'CALMA', special: 'CALMA' }, portrait: kairoPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, projectile: '' } },
  { id: 'mister', available: false, name: 'MISTER M', title: "ILUSIONISTA", primaryWeapon: "CALMA", specialWeapon: "CALMA", weaponStyles: { primary: "melee", special: "ranged" }, weaponLabels: { primary: 'CALMA', special: 'CALMA' }, portrait: misterPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, projectile: '' } },
  { id: 'ayame', available: false, name: 'AYAME KURENAI', title: "ARTISTA", primaryWeapon: "CALMA", specialWeapon: "CALMA", weaponStyles: { primary: "ranged", special: "melee" }, weaponLabels: { primary: 'CALMA', special: 'CALMA' }, portrait: ayamePortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: josiasSprite, ranged: josiasRangedSprite, attack: josiasAttackSprite, projectile: '' } },
  { id: 'eclides', available: true, name: 'ECLIDES', title: "ESPECIALISTA", primaryWeapon: "PISTOLA", specialWeapon: "BOMBA", weaponStyles: { primary: "ranged", special: "ranged" }, weaponLabels: { primary: 'PISTOLA', special: 'BOMBA' }, portrait: eclidesPortrait, playable: true, stats: { hp: 6, damage: 1, speed: 3.2 }, sprites: { melee: eclidesPistolSprite, ranged: eclidesPistolSprite, attack: eclidesPistolSprite, rangedAttack: eclidesThrowSprite, projectile: '' }, specialSprite: eclidesBombSprite, bombProjectile: eclidesBombProjectile },
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
  return { hp: character.stats.hp, maxHp: character.stats.hp, dmg: character.stats.damage, spd: character.stats.speed, weapon: "primary", hasSecondaryWeapon: true };
}

export function createEnemy(id: EnemyId, x: number, y: number, overrides: Partial<Pick<EnemyState, "hp" | "spd">> = {}): EnemyState {
  const definition = ENEMIES[id];
  const hp = overrides.hp ?? definition.hp;
  return { x, y, hp, max: hp, spd: overrides.spd ?? definition.speed, r: definition.radius, kind: id, hit: 0, shotCd: 0, moveT: 0 };
}

export function getCharacterSprite(character: CharacterDefinition | undefined, weapon: WeaponKind, attacking = false): string {
  const selected = character ?? CHARACTERS[0]!;
  if (selected.id === "eclides") return weapon === "special" ? attacking ? selected.sprites.rangedAttack ?? selected.specialSprite ?? selected.sprites.ranged : selected.specialSprite ?? selected.sprites.ranged : selected.sprites.ranged;
  if (selected.weaponStyles[weapon] === "ranged") return attacking ? selected.sprites.rangedAttack ?? selected.sprites.ranged : selected.sprites.ranged;
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
