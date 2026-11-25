import type { Room, Item } from "../types";
import { createBoss } from "./dungeon";
import { createEnemy } from "../characters";

export type WaveState = { wave: number; waveBreak: number };
type RandomBetween = (min: number, max: number) => number;

export function spawnWave(room: Room, wave: number, rnd: RandomBetween, say: (message: string) => void) {
  const healthMultiplier = 2 ** Math.floor(wave / 10);
  room.kind = wave % 10 === 0 ? "boss" : "normal";
  room.cleared = false;
  room.enemies = [];
  room.items = [];
  const corners: [number, number][] = [[0.9, 0.9], [10.1, 0.9], [0.9, 10.1], [10.1, 10.1]];
  if (wave % 10 === 0) {
    const hp = (30 + (wave / 10 - 1) * 12) * healthMultiplier;
    const [x, y] = corners[Math.floor(Math.random() * corners.length)]!;
    room.enemies.push(createBoss(hp, 1.7 + wave * 0.015, x, y));
    say(`O chefe da onda ${wave} chegou!`);
    return;
  }
  const count = Math.min(3 + Math.floor(wave * 0.8), 18);
  for (let i = 0; i < count; i++) {
    const ork = wave > 20 && i % 5 === 4;
    const bat = !ork && Math.random() < 0.35;
    const hp = ((ork ? 12 : bat ? 2 : 4) + Math.floor(wave / 10)) * healthMultiplier;
    const [cornerX, cornerY] = corners[i % corners.length]!;
    const x = bat ? rnd(2.2, 8.8) : cornerX + rnd(-0.35, 0.35);
    const y = bat ? rnd(2.2, 8.8) : cornerY + rnd(-0.35, 0.35);
    const enemy = createEnemy(ork ? "ork" : bat ? "bat" : "slime", x, y, { hp, spd: bat || ork ? 0 : 0.65 + wave * 0.025 });
    enemy.shotCd = bat ? rnd(0.7, 1.5) : 0;
    room.enemies.push(enemy);
  }
  say(`Onda ${wave} começando!`);
}

export function completeWave(room: Room, state: WaveState, say: (message: string) => void) {
  room.cleared = true;
  const healDrops = 1 + Math.floor(state.wave / 10);
  for (let i = 0; i < healDrops; i++) room.items.push({ x: 3 + i * 1.3, y: 5.5, kind: "potion" });
  const buffs = state.wave % 10 === 0 ? 2 : 1 + (state.wave % 5 === 0 ? 1 : 0);
  const buffKinds: Item["kind"][] = ["heart", "sword", "boots", "bow"];
  for (let i = 0; i < buffs; i++) room.items.push({ x: 4 + i * 1.2, y: 6.5, kind: buffKinds[Math.floor(Math.random() * buffKinds.length)]! });
  state.waveBreak = 10;
  say(`Onda ${state.wave} concluída! Recolha os itens. Próxima onda em breve...`);
}
