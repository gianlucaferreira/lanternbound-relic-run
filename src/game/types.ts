export type GameMode = "dungeon" | "waves";
import type { EnemyState, WeaponKind } from "./characters";
export type ItemKind = Exclude<Item["kind"], "phaseKey">;
export type HUD = { hp: number; maxHp: number; dmg: number; rooms: number; total: number; weapon: WeaponKind; hasSecondaryWeapon: boolean; itemCounts: Record<ItemKind, number>; status: "play" | "dead" | "win"; msg: string; mode: GameMode; wave: number; phase: number; phaseCount: number; enemiesRemaining: number; waveBreak: number };
export type Enemy = EnemyState;
export type Item = { x: number; y: number; kind: "heart" | "sword" | "bow" | "bombCase" | "boots" | "potion" | "relic" | "phaseKey" | "guizo" | "runa" };
export type Projectile = { x: number; y: number; vx: number; vy: number; life: number; owner: "player" | "enemy"; damage: number; spinning?: boolean; bishopCross?: boolean; explosive?: boolean };
export type Room = { gx: number; gy: number; enemies: Enemy[]; items: Item[]; cleared: boolean; visited: boolean; kind: "start" | "normal" | "boss" };
