export type GameMode = "dungeon" | "waves";
export type HUD = { hp: number; maxHp: number; dmg: number; rooms: number; total: number; weapon: "melee" | "bow"; hasBow: boolean; status: "play" | "dead" | "win"; msg: string; mode: GameMode; wave: number; enemiesRemaining: number; waveBreak: number };
export type Enemy = { x: number; y: number; hp: number; max: number; spd: number; r: number; kind: "slime" | "bat" | "boss"; hit: number; shotCd: number; moveT: number };
export type Item = { x: number; y: number; kind: "heart" | "sword" | "boots" | "bow" | "potion" | "relic" };
export type Projectile = { x: number; y: number; vx: number; vy: number; life: number; owner: "player" | "enemy"; damage: number };
export type Room = { gx: number; gy: number; enemies: Enemy[]; items: Item[]; cleared: boolean; visited: boolean; kind: "start" | "normal" | "boss" };
