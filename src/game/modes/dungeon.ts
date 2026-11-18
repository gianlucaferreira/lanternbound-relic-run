import type { Enemy, Room, Item } from "../types";
import { createEnemy } from "../characters";

const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function generateDungeon(
  rooms: Map<string, Room>,
  key: (x: number, y: number) => string,
  makeRoom: (gx: number, gy: number, kind: Room["kind"]) => Room,
  phase = 1,
) {
  let cx = 0, cy = 0;
  rooms.set(key(0, 0), makeRoom(0, 0, "start"));
  while (rooms.size < 9) {
    const [dx, dy] = DIRS[Math.floor(Math.random() * 4)]!;
    cx += dx; cy += dy;
    if (!rooms.has(key(cx, cy))) rooms.set(key(cx, cy), makeRoom(cx, cy, "normal"));
  }

  const distances = new Map<string, number>([[key(0, 0), 0]]);
  const queue: [number, number][] = [[0, 0]];
  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const [dx, dy] of DIRS) {
      const roomKey = key(x + dx, y + dy);
      if (rooms.has(roomKey) && !distances.has(roomKey)) {
        distances.set(roomKey, distances.get(key(x, y))! + 1);
        queue.push([x + dx, y + dy]);
      }
    }
  }
  const farthest = [...distances.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  const bossRoom = rooms.get(farthest)!;
  bossRoom.kind = "boss";
  // Same boss appearance across phases, with a tougher encounter each time.
  bossRoom.enemies = [createBoss(30 + (phase - 1) * 15, 1.7 + (phase - 1) * 0.2, 5.5, 4)];
  bossRoom.items = [];
}

export function completeDungeonRoom(room: Room, visitedRooms: number, say: (message: string) => void, secondaryWeapon: "sword" | "bow" = "bow", secondaryWeaponName = "besta", finalBoss = true) {
  const guaranteedSecondaryDrop = visitedRooms === 2;
  room.cleared = true;
  if (room.kind === "boss") {
    room.items.push({ x: 5.5, y: 5.5, kind: finalBoss ? "relic" : "phaseKey" });
    if (guaranteedSecondaryDrop) room.items.push({ x: 5.5, y: 5.5, kind: secondaryWeapon });
    say(finalBoss
      ? (guaranteedSecondaryDrop ? `O guardião caiu! Pegue o Café e a ${secondaryWeaponName}!` : "O guardião caiu! Pegue o Café!")
      : "Guardião derrotado! Pegue a escada para avançar de fase.");
  } else if (guaranteedSecondaryDrop) {
    room.items.push({ x: 5.5, y: 5.5, kind: secondaryWeapon });
    say(`Sala limpa! A ${secondaryWeaponName} garantida está no chão...`);
  } else if (Math.random() < 0.8) {
    const roll = Math.random();
    const kind: Item["kind"] = roll < 0.4 ? "heart" : roll < 0.7 ? "sword" : roll < 0.85 ? "boots" : "bow";
    room.items.push({ x: 5.5, y: 5.5, kind });
    say(kind === "bow" ? "Sala limpa! Uma besta está no chão..." : "Sala limpa! Algo brilha no chão...");
  } else say("Sala limpa!");
}

export function createBoss(hp: number, speed: number, x: number, y: number): Enemy {
  return createEnemy("boss", x, y, { hp, spd: speed });
}
