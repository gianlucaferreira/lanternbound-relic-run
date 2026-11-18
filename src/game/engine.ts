// Plain TS roguelike engine: logic + isometric canvas rendering.
import potionSrc from "@/assets/sprite-potion.png";
import heartItemSrc from "@/assets/sprite-heart.png";
import swordItemSrc from "@/assets/sprite-sword.png";
import scytheItemSrc from "@/assets/sprite-foice.png";
import brassKnucklesItemSrc from "@/assets/sprite-soco-ingles.png";
import hammerItemSrc from "@/assets/sprite-martelo.png";
import revolverItemSrc from "@/assets/sprite-revolver.png";
import bootsItemSrc from "@/assets/sprite-boots.png";
import relicItemSrc from "@/assets/sprite-cafe.png";
import guizoItemSrc from "@/assets/Guizo.png";
import attackCursorSrc from "@/assets/sprite-attack-cursor.png";
import swordSlashFrameOneSrc from "@/assets/sprite-corte.png";
import swordSlashFrameTwoSrc from "@/assets/sprite-corte-2.png";
import punchLineSrc from "@/assets/sprite-soco.png";
import { CHARACTER_SPRITES, CHARACTERS, ENEMIES, WEAPONS, createCharacterState, createEnemy, getCharacterSprite, type CharacterDefinition, type CharacterProgress } from "./characters";

import type { Enemy, HUD, Item, Projectile, Room, GameMode } from "./types";
import { completeDungeonRoom, generateDungeon } from "./modes/dungeon";
import { completeWave, spawnWave } from "./modes/waves";

export type { GameMode, HUD } from "./types";

const W = 11, TW = 64, TH = 32, WALL = 46;
// Sprite PNGs were cropped to their opaque bounds from 2048x2048 canvases.
// Keep their old on-screen footprint while preserving each crop's aspect ratio.
const SPRITE_SOURCE_SIZE = 2048;
const HERO_RENDER_HEIGHT = 76 * 1728 / SPRITE_SOURCE_SIZE;
const spriteWidth = (image: HTMLImageElement, size: number) => size * image.naturalWidth / SPRITE_SOURCE_SIZE;
const spriteHeight = (image: HTMLImageElement, size: number) => size * image.naturalHeight / SPRITE_SOURCE_SIZE;
const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const HEAL_DROP_CHANCE = 0.25;
const HEAL_AMOUNT = 1;
const GUIZO_DROP_CHANCE = 0.025;
const GUIZO_INVINCIBILITY_DURATION = 5;

export function startGame(canvas: HTMLCanvasElement, onHud: (h: HUD) => void, mode: GameMode = "dungeon", onPause?: (paused: boolean) => void, onSkipWave?: (skip: () => void) => void, character?: CharacterDefinition, progress?: CharacterProgress, onProgress?: () => void) {
  const mkImg = (src: string) => { const image = new Image(); image.src = src; return image; };
  const selectedCharacter = character ?? CHARACTERS[0]!;
  const SPR = {
    hero: mkImg(selectedCharacter.sprites.melee),
    heroAttack: mkImg(selectedCharacter.sprites.attack),
    heroRanged: mkImg(selectedCharacter.sprites.ranged),
    heroRangedAttack: selectedCharacter.sprites.rangedAttack ? mkImg(selectedCharacter.sprites.rangedAttack) : mkImg(selectedCharacter.sprites.ranged),
    slime: mkImg(ENEMIES.slime.sprite),
    bat: mkImg(ENEMIES.bat.sprite),
    boss: mkImg(ENEMIES.boss.sprite),
    playerProjectile: mkImg(selectedCharacter.id === "kaya" ? CHARACTER_SPRITES.goldenProjectile : WEAPONS.bow.projectile),
    projectile: mkImg(CHARACTER_SPRITES.goldenProjectile),
    potion: mkImg(potionSrc),
    heartItem: mkImg(heartItemSrc),
    bootsItem: mkImg(bootsItemSrc),
    relicItem: mkImg(relicItemSrc),
    guizoItem: mkImg(guizoItemSrc),
    attackCursor: mkImg(attackCursorSrc),
    swordSlashFrames: [mkImg(swordSlashFrameOneSrc), mkImg(swordSlashFrameTwoSrc)],
    punchLine: mkImg(punchLineSrc),
  };
  const ITEM_SPRITES: Record<Item["kind"], HTMLImageElement> = {
    heart: SPR.heartItem,
    sword: mkImg(selectedCharacter.id === "kaya" ? scytheItemSrc : selectedCharacter.id === "josias" ? brassKnucklesItemSrc : swordItemSrc),
    boots: SPR.bootsItem,
    bow: mkImg(selectedCharacter.id === "kaya" ? revolverItemSrc : selectedCharacter.id === "josias" ? hammerItemSrc : WEAPONS.bow.sprite),
    potion: SPR.potion,
    relic: SPR.relicItem,
    guizo: SPR.guizoItem,
  };
  const ctx = canvas.getContext("2d")!;
  const rooms = new Map<string, Room>();
  const key = (x: number, y: number) => `${x},${y}`;
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  if (mode === "dungeon") generateDungeon(rooms, key, mkRoom);
  else rooms.set(key(0, 0), mkRoom(0, 0, "start"));

  function mkRoom(gx: number, gy: number, kind: Room["kind"]): Room {
    const enemies: Enemy[] = [];
    if (kind === "normal") {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const bat = Math.random() < 0.4;
        const enemy = createEnemy(bat ? "bat" : "slime", rnd(2, 9), rnd(2, 6));
        enemy.shotCd = bat ? rnd(0.7, 1.5) : 0;
        enemies.push(enemy);
      }
    }
    return { gx, gy, enemies, items: [], cleared: kind === "start", visited: kind === "start", kind };
  }

  const p = { x: 5.5, y: 5.5, ...createCharacterState(selectedCharacter), hasSecondaryWeapon: !["kaya", "josias"].includes(selectedCharacter.id) || mode !== "dungeon", fx: 0, fy: 1, atk: 0, cd: 0, inv: 0 };
  const projectiles: Projectile[] = [];
  let room = rooms.get(key(0, 0))!;
  let wave = mode === "waves" ? 1 : 0;
  let waveBreak = 0;
  let msg = "Encontre o Café !";
  let msgT = 4;
  if (mode === "waves") spawnWave(room, wave, rnd, say);
  let status: HUD["status"] = "play";
  let paused = false;
  const skipWave = () => {
    if (mode !== "waves" || waveBreak <= 0 || status !== "play" || paused) return;
    waveBreak = 0;
    wave += 1;
    spawnWave(room, wave, rnd, say);
  };
  onSkipWave?.(skipWave);
  const keys = new Set<string>();
  const gameKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", " "]);
  const kd = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "escape" && status === "play") {
      e.preventDefault();
      if (!e.repeat) {
        paused = !paused;
        keys.clear();
        onPause?.(paused);
      }
      return;
    }
    if (paused) return;
    if (k === "t" && mode === "waves") {
      e.preventDefault();
      if (!e.repeat) skipWave();
      return;
    }
    if (!gameKeys.has(k)) {
      if (k === "tab") e.preventDefault();
      return;
    }
    e.preventDefault();
    keys.add(k);
    if (k === "q" && !e.repeat && p.hasSecondaryWeapon) { p.weapon = p.weapon === "melee" ? "bow" : "melee"; say(`${selectedCharacter.weaponLabels[p.weapon]} equipada!`); }
    if (k === " ") attack();
  };
  const ku = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  const click = () => attack();
  canvas.addEventListener("pointerdown", click);

  function say(m: string) { msg = m; msgT = 3; }
  function clearRoomIfNeeded() {
    if (room.enemies.length || room.cleared) return;
    if (mode === "waves") {
      completeWave(room, { wave, waveBreak }, say);
      waveBreak = 10;
      return;
    }
    const phase = [...rooms.values()].filter((candidate) => candidate.visited).length;
    const secondaryWeaponDrop = selectedCharacter.id === "kaya" ? "sword" : "bow";
    const secondaryWeaponName = selectedCharacter.id === "kaya" ? "foice" : selectedCharacter.id === "josias" ? "martelo" : "besta";
    completeDungeonRoom(room, phase, say, secondaryWeaponDrop, secondaryWeaponName);
  }
  function removeDefeatedEnemies() {
    const survivors: Enemy[] = [];
    for (const enemy of room.enemies) {
      if (enemy.hp > 0) {
        survivors.push(enemy);
      } else {
        onProgress?.();
        if (Math.random() < (mode === "waves" ? 0.1 : HEAL_DROP_CHANCE)) room.items.push({ x: enemy.x, y: enemy.y, kind: "potion" });
        if (Math.random() < GUIZO_DROP_CHANCE) room.items.push({ x: enemy.x, y: enemy.y, kind: "guizo" });
      }
    }
    room.enemies = survivors;
  }
  function attack() {
    if (p.cd > 0 || status !== "play") return;
    p.atk = 0.18;
    const isJosiasHammer = selectedCharacter.id === "josias" && p.weapon === "bow";
    if (p.weapon === "bow" && !isJosiasHammer) {
      p.cd = 0.42;
      projectiles.push({ x: p.x + p.fx * 0.45, y: p.y + p.fy * 0.45, vx: p.fx * 10, vy: p.fy * 10, life: 1.2, owner: "player", damage: p.dmg });
      return;
    }
    p.cd = 0.35;
    const meleeReach = isJosiasHammer ? 1.85 : selectedCharacter.id === "kaya" ? 1.6 : selectedCharacter.id === "josias" ? 1.15 : 1.3;
    const isJosiasPunch = selectedCharacter.id === "josias" && p.weapon === "melee";
    const meleeDamage = p.dmg + (isJosiasPunch ? 1 : 0);
    let punchTarget: Enemy | undefined;
    let punchTargetDistance = Infinity;
    for (const e of room.enemies) {
      const hitX = e.x, hitY = e.y + (ENEMIES[e.kind].ranged ? 0.25 : 0);
      const dx = hitX - p.x, dy = hitY - p.y, d = Math.hypot(dx, dy);
      if (d < meleeReach + e.r && (dx * p.fx + dy * p.fy) / (d || 1) > 0.2) {
        if (isJosiasPunch) {
          if (d < punchTargetDistance) { punchTarget = e; punchTargetDistance = d; }
          continue;
        }
        e.hp -= meleeDamage; e.hit = 0.15; e.x += (dx / d) * 0.5; e.y += (dy / d) * 0.5;
      }
    }
    if (punchTarget) {
      const dx = punchTarget.x - p.x, dy = punchTarget.y - p.y, d = Math.hypot(dx, dy) || 1;
      punchTarget.hp -= meleeDamage; punchTarget.hit = 0.15;
      punchTarget.x += (dx / d) * 0.5; punchTarget.y += (dy / d) * 0.5;
    }
    removeDefeatedEnemies();
    clearRoomIfNeeded();
  }

  function door(dir: number) {
    const [dx, dy] = DIRS[dir]!;
    return rooms.has(key(room.gx + dx, room.gy + dy));
  }

  function hurtPlayer(damage: number, knockX: number, knockY: number) {
    if (p.inv > 0 || status !== "play") return;
    p.hp = Math.max(0, p.hp - damage);
    p.inv = 0.8;
    const distance = Math.hypot(knockX, knockY) || 1;
    p.x += (knockX / distance) * 0.6;
    p.y += (knockY / distance) * 0.6;
    if (p.hp <= 0) status = "dead";
  }

  function update(dt: number) {
    if (msgT > 0) msgT -= dt;
    if (status !== "play") return;
    p.cd -= dt; p.atk -= dt; p.inv -= dt;
    // Iso-aligned input: up = toward top of screen
    let ix = 0, iy = 0;
    if (keys.has("w") || keys.has("arrowup")) { ix -= 1; iy -= 1; }
    if (keys.has("s") || keys.has("arrowdown")) { ix += 1; iy += 1; }
    if (keys.has("a") || keys.has("arrowleft")) { ix -= 1; iy += 1; }
    if (keys.has("d") || keys.has("arrowright")) { ix += 1; iy -= 1; }
    const l = Math.hypot(ix, iy);
    if (l) { ix /= l; iy /= l; p.fx = ix; p.fy = iy; }
    let nx = p.x + ix * p.spd * dt, ny = p.y + iy * p.spd * dt;
    const mid = (v: number) => Math.abs(v - 5.5) < 0.8;
    const open = mode === "dungeon" && room.cleared;
    // walls with door gaps
    if (ny < 0.4 && !(open && mid(nx) && door(0))) ny = 0.4;
    if (ny > W - 0.4 && !(open && mid(nx) && door(2))) ny = W - 0.4;
    if (nx < 0.4 && !(open && mid(ny) && door(3))) nx = 0.4;
    if (nx > W - 0.4 && !(open && mid(ny) && door(1))) nx = W - 0.4;
    p.x = nx; p.y = ny;
    // room transitions
    const go = (dx: number, dy: number, px: number, py: number) => {
      projectiles.length = 0;
      room = rooms.get(key(room.gx + dx, room.gy + dy))!; room.visited = true; p.x = px; p.y = py;
      if (room.kind === "boss" && !room.cleared) say("Um guardião protege o tesouro!");
    };
    if (mode === "dungeon" && p.y < -0.2) go(0, -1, 5.5, W - 0.6);
    else if (mode === "dungeon" && p.y > W + 0.2) go(0, 1, 5.5, 0.6);
    else if (mode === "dungeon" && p.x < -0.2) go(-1, 0, W - 0.6, 5.5);
    else if (mode === "dungeon" && p.x > W + 0.2) go(1, 0, 0.6, 5.5);

    if (mode === "waves" && waveBreak > 0) {
      waveBreak = Math.max(0, waveBreak - dt);
      if (waveBreak === 0) { wave += 1; spawnWave(room, wave, rnd, say); }
    }

    for (const e of room.enemies) {
      e.hit -= dt;
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (ENEMIES[e.kind].ranged) {
        e.shotCd -= dt;
        if (e.shotCd <= 0) {
          projectiles.push({ x: e.x, y: e.y, vx: (dx / d) * 4.2, vy: (dy / d) * 4.2, life: 2.5, owner: "enemy", damage: 1 });
          e.shotCd = 1.8 + rnd(0, 0.4);
        }
        continue;
      }

      if (e.kind === "boss") {
        // Start with a sideways dodge and use broad, slower turns while closing in.
        e.moveT += dt;
        const zigzag = Math.cos(e.moveT * 4.5) * 1.5;
        e.x += ((dx / d) - (dy / d) * zigzag) * e.spd * dt;
        e.y += ((dy / d) + (dx / d) * zigzag) * e.spd * dt;
      } else {
        e.x += (dx / d) * e.spd * dt; e.y += (dy / d) * e.spd * dt;
      }
      e.x = Math.max(0.5, Math.min(W - 0.5, e.x)); e.y = Math.max(0.5, Math.min(W - 0.5, e.y));
      if (d < e.r + 0.35) hurtPlayer(ENEMIES[e.kind].contactDamage, dx, dy);
    }
    // Keep every enemy type from occupying the same space. Resolve overlaps
    // after movement so enemies naturally queue behind one another as they
    // converge on the player.
    for (let i = 0; i < room.enemies.length; i++) {
      const a = room.enemies[i]!;
      for (let j = i + 1; j < room.enemies.length; j++) {
        const b = room.enemies[j]!;
        let dx = b.x - a.x, dy = b.y - a.y;
        let distance = Math.hypot(dx, dy);
        const minDistance = a.r + b.r;
        if (distance >= minDistance) continue;
        if (distance < 0.0001) {
          // Deterministic direction prevents coincident spawns from sticking.
          const angle = ((i * 31 + j * 17) % 360) * Math.PI / 180;
          dx = Math.cos(angle); dy = Math.sin(angle); distance = 1;
        }
        const push = (minDistance - distance) / 2;
        const nx = dx / distance, ny = dy / distance;
        a.x = Math.max(0.5, Math.min(W - 0.5, a.x - nx * push));
        a.y = Math.max(0.5, Math.min(W - 0.5, a.y - ny * push));
        b.x = Math.max(0.5, Math.min(W - 0.5, b.x + nx * push));
        b.y = Math.max(0.5, Math.min(W - 0.5, b.y + ny * push));
      }
    }
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const shot = projectiles[i]!;
      shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
      let hit = false;
      if (shot.owner === "player") {
        for (const e of room.enemies) {
          const hitX = e.x, hitY = e.y + (ENEMIES[e.kind].ranged ? 0.25 : 0);
          if (Math.hypot(hitX - shot.x, hitY - shot.y) > e.r + 0.2) continue;
          e.hp -= shot.damage; e.hit = 0.15;
          const distance = Math.hypot(shot.vx, shot.vy) || 1;
          e.x += (shot.vx / distance) * 0.18; e.y += (shot.vy / distance) * 0.18;
          hit = true; break;
        }
      } else if (Math.hypot(p.x - shot.x, p.y - shot.y) < 0.42) {
        hurtPlayer(shot.damage, shot.vx, shot.vy);
        hit = true;
      }
      if (hit || shot.life <= 0 || shot.x < 0.4 || shot.x > W - 0.4 || shot.y < 0.4 || shot.y > W - 0.4) projectiles.splice(i, 1);
    }
    removeDefeatedEnemies();
    clearRoomIfNeeded();
    room.items = room.items.filter((it) => {
      if (Math.hypot(it.x - p.x, it.y - p.y) > 0.6) return true;
      if (it.kind === "potion" && p.hp >= p.maxHp) return true;
      if (it.kind === "heart") { p.maxHp += 1; p.hp = p.maxHp; say("Coração! Vida máxima +1"); }
      if (it.kind === "sword") {
        p.dmg += 1;
        if (!p.hasSecondaryWeapon && selectedCharacter.id === "kaya") {
          p.hasSecondaryWeapon = true;
          say(`${selectedCharacter.weaponLabels.melee} desbloqueada! Pressione Q para trocar de arma.`);
        } else say(`${selectedCharacter.weaponLabels.melee} aprimorada! Dano +1`);
      }
      if (it.kind === "boots") { p.spd += 0.6; say("Botas ligeiras! Velocidade +"); }
      if (it.kind === "potion") { const healed = Math.min(HEAL_AMOUNT, p.maxHp - p.hp); p.hp += healed; say(`Poção! +${healed} de vida`); }
      if (it.kind === "bow") {
        if (!p.hasSecondaryWeapon && selectedCharacter.id === "josias") {
          p.hasSecondaryWeapon = true;
          say(`${selectedCharacter.weaponLabels.bow} desbloqueado! Pressione Q para trocar de arma.`);
        } else {
          p.dmg += 1; say(`${selectedCharacter.weaponLabels.bow} reforçada! Dano +1`);
        }
      }
      if (it.kind === "guizo") { p.inv = Math.max(p.inv, GUIZO_INVINCIBILITY_DURATION); say("Guizo raro! Invencibilidade por 5 segundos!"); }
      if (it.kind === "relic") { status = "win"; }
      return false;
    });
  }

  // ---------- rendering ----------
  let ox = 0, oy = 0;
  const iso = (x: number, y: number): [number, number] => [ox + (x - y) * TW / 2, oy + (x + y) * TH / 2];
  function poly(pts: [number, number][], fill: string, stroke?: string) {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function render(t: number) {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const pixelWidth = Math.round(cw * dpr), pixelHeight = Math.round(ch * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createRadialGradient(cw / 2, ch / 2, 50, cw / 2, ch / 2, cw * 0.7);
    g.addColorStop(0, "#1d1a22"); g.addColorStop(1, "#08070a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    // Scale the dungeon to the available viewport while leaving room for the HUD.
    const sceneScale = Math.min((cw - 48) / (W * TW), (ch - 112) / (W * TH), 2.8);
    ctx.setTransform(dpr * sceneScale, 0, 0, dpr * sceneScale, 0, 0);
    ox = cw / (2 * sceneScale); oy = ch / (2 * sceneScale) - (W * TH) / 2 + 20;
    const boss = room.kind === "boss";
    // floor
    for (let i = 0; i < W; i++) for (let j = 0; j < W; j++) {
      const shade = ((i * 7 + j * 13 + room.gx * 3 + room.gy * 5) % 5) * 4;
      const base = boss ? [70 + shade, 38 + shade / 2, 36] : [58 + shade, 54 + shade, 62 + shade];
      poly([iso(i, j), iso(i + 1, j), iso(i + 1, j + 1), iso(i, j + 1)], `rgb(${base})`, "rgba(0,0,0,0.35)");
    }
    // back walls (top-left: x=0, top-right: y=0)
    const wallSeg = (a: [number, number], b: [number, number], col: string) => poly([a, b, [b[0], b[1] - WALL], [a[0], a[1] - WALL]], col, "rgba(0,0,0,0.5)");
    for (let k = 0; k < W; k++) {
      const gapY = room.cleared ? false : true;
      const isDoorN = Math.abs(k + 0.5 - 5.5) < 0.6 && door(0);
      const isDoorW = Math.abs(k + 0.5 - 5.5) < 0.6 && door(3);
      if (!isDoorN) wallSeg(iso(k, 0), iso(k + 1, 0), k % 2 ? "#3a3440" : "#423b49");
      else if (gapY) wallSeg(iso(k, 0), iso(k + 1, 0), "#6b3b2a");
      if (!isDoorW) wallSeg(iso(0, k), iso(0, k + 1), k % 2 ? "#2c2731" : "#332d39");
      else if (gapY) wallSeg(iso(0, k), iso(0, k + 1), "#5a3123");
    }
    // front door markers
    const mark = (x: number, y: number) => {
      const [sx, sy] = iso(x, y);
      ctx.fillStyle = room.cleared ? "rgba(255,200,90,0.8)" : "rgba(160,40,40,0.8)";
      ctx.beginPath(); ctx.ellipse(sx, sy, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
    };
    if (door(2)) mark(5.5, W); if (door(1)) mark(W, 5.5);
    // torches
    for (const [x, y] of [[2.5, 0], [8.5, 0], [0, 2.5], [0, 8.5]] as [number, number][]) {
      const [sx, sy] = iso(x, y); const f = 0.7;
      const tg = ctx.createRadialGradient(sx, sy - 30, 2, sx, sy - 30, 60);
      tg.addColorStop(0, `rgba(255,170,70,${0.5 * f})`); tg.addColorStop(1, "rgba(255,170,70,0)");
      ctx.fillStyle = tg; ctx.fillRect(sx - 60, sy - 90, 120, 120);
      ctx.fillStyle = "#ffcf6a"; ctx.beginPath(); ctx.arc(sx, sy - 30, 4 * f, 0, Math.PI * 2); ctx.fill();
    }
    // entities sorted by depth
    type D = { d: number; draw: () => void };
    const list: D[] = [];
    const shadow = (sx: number, sy: number, r: number) => { ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(sx, sy, r, r / 2, 0, 0, Math.PI * 2); ctx.fill(); };
    for (const it of room.items) list.push({
      d: it.x + it.y, draw: () => {
        const [sx, sy] = iso(it.x, it.y); const b = Math.sin(t / 250) * 4; shadow(sx, sy, 10);
        const size = { heart: 40, sword: 48, boots: 44, bow: 56, potion: 44, relic: 56, guizo: 48 }[it.kind];
        if (it.kind === "relic") {
          const rg = ctx.createRadialGradient(sx, sy - 24, 2, sx, sy - 24, 40); rg.addColorStop(0, "rgba(255,220,90,0.7)"); rg.addColorStop(1, "rgba(255,220,90,0)"); ctx.fillStyle = rg; ctx.fillRect(sx - 40, sy - 64, 80, 80);
        }
        if (it.kind === "guizo") {
          const rg = ctx.createRadialGradient(sx, sy - 20, 2, sx, sy - 20, 30); rg.addColorStop(0, "rgba(255,220,90,0.55)"); rg.addColorStop(1, "rgba(255,220,90,0)"); ctx.fillStyle = rg; ctx.fillRect(sx - 30, sy - 50, 60, 60);
        }
        const sprite = ITEM_SPRITES[it.kind];
        if (sprite.complete && sprite.naturalWidth > 0) {
          const width = spriteWidth(sprite, size), height = spriteHeight(sprite, size);
          ctx.drawImage(sprite, sx - width / 2, sy - height + 4 + b, width, height);
        }
      }
    });
    for (const e of room.enemies) list.push({
      d: e.x + e.y, draw: () => {
        const [sx, sy] = iso(e.x, e.y); const s = e.r * 40;
        const lift = e.kind === "bat" ? 16 : s * 0.7 - 8;
        shadow(sx, sy, e.kind === "slime" ? 16 : s * 0.8);
        const img = SPR[e.kind]; const size = e.kind === "bat" ? 80 : e.kind === "slime" ? 80 : 76;
        const flip = e.x - e.y > p.x - p.y;
        const spriteY = e.kind === "bat" ? sy : sy - lift + s * 0.7;
        ctx.save(); ctx.translate(sx, spriteY); if (flip) ctx.scale(-1, 1);
        if (e.hit > 0) ctx.filter = "brightness(3)";
        if (img.complete && img.naturalWidth > 0) {
          const width = spriteWidth(img, size), height = spriteHeight(img, size);
          ctx.drawImage(img, -width / 2, -height, width, height);
        }
        ctx.restore();
        const lift2 = e.kind === "boss" ? size - s * 0.7 - 10 : 0;
        if (e.kind === "boss") { ctx.fillStyle = "#222"; ctx.fillRect(sx - 30, sy - lift - lift2 - s - 14, 60, 6); ctx.fillStyle = "#e84a5f"; ctx.fillRect(sx - 30, sy - lift - lift2 - s - 14, 60 * (e.hp / e.max), 6); }
      }
    });
    for (const shot of projectiles) list.push({
      d: shot.x + shot.y, draw: () => {
        const [sx, sy] = iso(shot.x, shot.y);
        const [vx, vy] = [(shot.vx - shot.vy) * TW / 2, (shot.vx + shot.vy) * TH / 2];
        if (shot.owner === "player" && SPR.playerProjectile.complete && SPR.playerProjectile.naturalWidth > 0) {
          ctx.save(); ctx.translate(sx, sy - 40); ctx.rotate(Math.atan2(vy, vx));
          const width = spriteWidth(SPR.playerProjectile, 62), height = spriteHeight(SPR.playerProjectile, 62);
          ctx.scale(-1, 1); ctx.drawImage(SPR.playerProjectile, -width / 2, -height / 2, width, height); ctx.restore();
        } else if (shot.owner === "enemy" && SPR.projectile.complete && SPR.projectile.naturalWidth > 0) {
          ctx.save(); ctx.translate(sx, sy - 24); ctx.rotate(Math.atan2(vy, vx));
          const width = spriteWidth(SPR.projectile, 48), height = spriteHeight(SPR.projectile, 48);
          ctx.scale(-1, 1); ctx.drawImage(SPR.projectile, -width / 2, -height / 2, width, height); ctx.restore();
        }
      }
    });
    list.push({
      d: p.x + p.y, draw: () => {
        const [sx, sy] = iso(p.x, p.y); shadow(sx, sy, 13);
        if (p.inv > 0 && Math.floor(t / 80) % 2) return;
        const [fx, fy] = [(p.fx - p.fy) * TW / 2, (p.fx + p.fy) * TH / 2];
        const [cursorX, cursorY] = iso(p.x + p.fx * 0.85, p.y + p.fy * 0.85);
        const [slashX, slashY] = iso(p.x + p.fx * 0.58, p.y + p.fy * 0.58);
        if (SPR.attackCursor.complete && SPR.attackCursor.naturalWidth > 0) {
          ctx.save(); ctx.translate(cursorX, cursorY - 3); ctx.rotate(Math.atan2(fy, fx));
          ctx.scale(-1, 1);
          const cursorSize = 50;
          const cursorWidth = spriteWidth(SPR.attackCursor, cursorSize);
          const cursorHeight = spriteHeight(SPR.attackCursor, cursorSize);
          ctx.drawImage(SPR.attackCursor, -cursorWidth / 2, -cursorHeight / 2, cursorWidth, cursorHeight);
          ctx.restore();
        }
        // Josias's punch uses a sweeping line; the hammer and other melee weapons use the shared two-frame swing.
        const isJosiasPunch = selectedCharacter.id === "josias" && p.weapon === "melee";
        const isMeleeAttack = p.weapon === "melee" || (selectedCharacter.id === "josias" && p.weapon === "bow");
        if (isMeleeAttack && p.atk > 0) {
          const elapsed = 0.18 - p.atk;
          const frame = isJosiasPunch ? SPR.punchLine : SPR.swordSlashFrames[Math.min(1, Math.floor(elapsed / 0.09))]!;
          if (frame.complete && frame.naturalWidth > 0) {
            const isJosiasHammer = selectedCharacter.id === "josias" && p.weapon === "bow";
            const progress = Math.min(1, elapsed / 0.18);
            const josiasFacingDown = isJosiasPunch && p.fx > 0.5 && p.fy > 0.5;
            const swingDistance = isJosiasPunch ? 0.34 + progress * 0.48 + (josiasFacingDown ? 0.55 : 0) : isJosiasHammer ? 0.78 : 0.58;
            const [swingX, swingY] = iso(p.x + p.fx * swingDistance, p.y + p.fy * swingDistance);
            ctx.save();
            ctx.translate(swingX, swingY - (isJosiasPunch ? 28 : 10));
            ctx.rotate(Math.atan2(fy, fx));
            const slashSize = isJosiasPunch ? 54 + progress * 10 : isJosiasHammer ? 88 : 76;
            const slashWidth = spriteWidth(frame, slashSize);
            const slashHeight = spriteHeight(frame, slashSize);
            ctx.globalAlpha = Math.min(1, p.atk / 0.07);
            ctx.drawImage(frame, -slashWidth / 2, -slashHeight / 2, slashWidth, slashHeight);
            ctx.restore();
          }
        }
        const [hx] = [(p.fx - p.fy)];
        ctx.save(); ctx.translate(sx, sy + 4); if (hx < -0.05) ctx.scale(-1, 1);
        const isHammerAttack = selectedCharacter.id === "josias" && p.weapon === "bow" && p.atk > 0;
        const heroSource = isHammerAttack ? selectedCharacter.sprites.rangedAttack ?? selectedCharacter.sprites.ranged : getCharacterSprite(selectedCharacter, p.weapon, p.atk > 0);
        const heroSprite = isHammerAttack ? SPR.heroRangedAttack : heroSource === selectedCharacter.sprites.melee ? SPR.hero : heroSource === selectedCharacter.sprites.ranged ? SPR.heroRanged : SPR.heroAttack;
        if (heroSprite.complete && heroSprite.naturalWidth > 0) {
          const isKayaIdleScythe = selectedCharacter.id === "kaya" && heroSource === selectedCharacter.sprites.melee;
          const height = HERO_RENDER_HEIGHT * (isKayaIdleScythe ? 1.1 : 1);
          const width = height * heroSprite.naturalWidth / heroSprite.naturalHeight;
          ctx.drawImage(heroSprite, -width / 2, -height, width, height);
        }
        ctx.restore();
      }
    });
    list.sort((a, b) => a.d - b.d).forEach((x) => x.draw());
    // The reference map is only used in dungeon mode; keep it clear of the HUD.
    if (mode === "dungeon") {
      const ms = 14, margin = 20, padding = 8;
      const xs = [...rooms.values()];
      const minX = Math.min(...xs.map((r) => r.gx)), maxX = Math.max(...xs.map((r) => r.gx));
      const minY = Math.min(...xs.map((r) => r.gy)), maxY = Math.max(...xs.map((r) => r.gy));
      const mapWidth = (maxX - minX + 1) * ms;
      const mx = cw - margin - padding - mapWidth, my = margin + padding;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgba(8, 7, 10, 0.72)";
      ctx.fillRect(mx - padding, my - padding, mapWidth + padding * 2, (maxY - minY + 1) * ms + padding * 2);
      for (const r of xs) {
        if (!r.visited && ![...DIRS].some(([dx, dy]) => rooms.get(key(r.gx + dx, r.gy + dy))?.visited)) continue;
        ctx.fillStyle = r === room ? "#ffd447" : r.visited ? (r.kind === "boss" ? "#a8322d" : "#8a8494") : "#3a3640";
        ctx.fillRect(mx + (r.gx - minX) * ms, my + (r.gy - minY) * ms, ms - 3, ms - 3);
      }
      ctx.restore();
    }
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT); ctx.fillStyle = "#f3e6c4"; ctx.font = "600 18px 'Cinzel', serif"; ctx.textAlign = "center"; ctx.fillText(msg, cw / 2, ch - 40); ctx.globalAlpha = 1; }
  }

  let last = performance.now(), raf = 0, hudT = 0;
  const loop = (t: number) => {
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    if (!paused) update(dt);
    render(t);
    hudT -= dt;
    if (hudT <= 0) { hudT = 0.1; onHud({ hp: p.hp, maxHp: p.maxHp, dmg: p.dmg, rooms: xsVisited(), total: rooms.size, weapon: p.weapon, hasSecondaryWeapon: p.hasSecondaryWeapon, status, msg, mode, wave, enemiesRemaining: room.enemies.length, waveBreak }); }
    raf = requestAnimationFrame(loop);
  };
  const xsVisited = () => [...rooms.values()].filter((r) => r.visited).length;
  raf = requestAnimationFrame(loop);
  canvas.dataset["sceneReady"] = "1";
  return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); canvas.removeEventListener("pointerdown", click); };
}
