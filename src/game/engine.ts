// Plain TS roguelike engine: logic + isometric canvas rendering.
import heroSrc from "@/assets/sprite-hero.png";
import slimeSrc from "@/assets/sprite-slime.png";
import batSrc from "@/assets/sprite-bat.png";
import bossSrc from "@/assets/sprite-boss.png";
import rangedHeroSrc from "@/assets/sprite-hero-ranged.png";
import bowSrc from "@/assets/sprite-crossbow.png";
import arrowSrc from "@/assets/sprite-arrow.png";
import potionSrc from "@/assets/sprite-potion.png";
import heartItemSrc from "@/assets/sprite-heart.png";
import swordItemSrc from "@/assets/sprite-sword.png";
import bootsItemSrc from "@/assets/sprite-boots.svg";
import relicItemSrc from "@/assets/sprite-cafe.png";

export type HUD = { hp: number; maxHp: number; dmg: number; rooms: number; total: number; weapon: "melee" | "bow"; hasBow: boolean; status: "play" | "dead" | "win"; msg: string };
type Enemy = { x: number; y: number; hp: number; max: number; spd: number; r: number; kind: "slime" | "bat" | "boss"; hit: number; shotCd: number };
type Item = { x: number; y: number; kind: "heart" | "sword" | "boots" | "bow" | "potion" | "relic" };
type Projectile = { x: number; y: number; vx: number; vy: number; life: number; owner: "player" | "enemy"; damage: number };
type Room = { gx: number; gy: number; enemies: Enemy[]; items: Item[]; cleared: boolean; visited: boolean; kind: "start" | "normal" | "boss" };

const W = 11, TW = 64, TH = 32, WALL = 46;
const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const HEAL_DROP_CHANCE = 0.25;
const HEAL_AMOUNT = 2;

export function startGame(canvas: HTMLCanvasElement, onHud: (h: HUD) => void) {
  const mkImg = (src: string) => { const image = new Image(); image.src = src; return image; };
  const SPR = {
    hero: mkImg(heroSrc),
    heroRanged: mkImg(rangedHeroSrc),
    slime: mkImg(slimeSrc),
    bat: mkImg(batSrc),
    boss: mkImg(bossSrc),
    bow: mkImg(bowSrc),
    arrow: mkImg(arrowSrc),
    potion: mkImg(potionSrc),
    heartItem: mkImg(heartItemSrc),
    swordItem: mkImg(swordItemSrc),
    bootsItem: mkImg(bootsItemSrc),
    relicItem: mkImg(relicItemSrc),
  };
  const ITEM_SPRITES: Record<Item["kind"], HTMLImageElement> = {
    heart: SPR.heartItem,
    sword: SPR.swordItem,
    boots: SPR.bootsItem,
    bow: SPR.bow,
    potion: SPR.potion,
    relic: SPR.relicItem,
  };
  const ctx = canvas.getContext("2d")!;
  const rooms = new Map<string, Room>();
  const key = (x: number, y: number) => `${x},${y}`;
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  // Generate dungeon via random walk
  let cx = 0, cy = 0;
  rooms.set(key(0, 0), mkRoom(0, 0, "start"));
  while (rooms.size < 9) {
    const [dx, dy] = DIRS[Math.floor(Math.random() * 4)]!;
    cx += dx; cy += dy;
    if (!rooms.has(key(cx, cy))) rooms.set(key(cx, cy), mkRoom(cx, cy, "normal"));
  }
  // farthest room = boss
  const dist = new Map<string, number>([[key(0, 0), 0]]);
  const q: [number, number][] = [[0, 0]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of DIRS) { const k = key(x + dx, y + dy); if (rooms.has(k) && !dist.has(k)) { dist.set(k, dist.get(key(x, y))! + 1); q.push([x + dx, y + dy]); } }
  }
  const far = [...dist.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  const boss = rooms.get(far)!; boss.kind = "boss";
  boss.enemies = [{ x: 5.5, y: 4, hp: 30, max: 30, spd: 0.75, r: 0.7, kind: "boss", hit: 0, shotCd: 0 }];
  boss.items = [];

  function mkRoom(gx: number, gy: number, kind: Room["kind"]): Room {
    const enemies: Enemy[] = [];
    if (kind === "normal") {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const bat = Math.random() < 0.4;
        enemies.push({ x: rnd(2, 9), y: rnd(2, 6), hp: bat ? 2 : 4, max: bat ? 2 : 4, spd: bat ? 0 : 0.65, r: 0.35, kind: bat ? "bat" : "slime", hit: 0, shotCd: bat ? rnd(0.7, 1.5) : 0 });
      }
    }
    return { gx, gy, enemies, items: [], cleared: kind === "start", visited: kind === "start", kind };
  }

  const p = { x: 5.5, y: 5.5, hp: 6, maxHp: 6, dmg: 1, spd: 3.2, fx: 0, fy: 1, atk: 0, cd: 0, inv: 0, weapon: "melee" as "melee" | "bow", hasBow: false };
  const projectiles: Projectile[] = [];
  let room = rooms.get(key(0, 0))!;
  let status: HUD["status"] = "play";
  let msg = "Encontre o Café !";
  let msgT = 4;
  const keys = new Set<string>();
  const kd = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k === "q" && !e.repeat && p.hasBow) { p.weapon = p.weapon === "melee" ? "bow" : "melee"; say(p.weapon === "bow" ? "Besta equipada!" : "Lâmina equipada!"); }
    if (e.key === " ") { e.preventDefault(); attack(); }
  };
  const ku = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  const click = () => attack();
  canvas.addEventListener("pointerdown", click);

  function say(m: string) { msg = m; msgT = 3; }
  function clearRoomIfNeeded() {
    if (room.enemies.length || room.cleared) return;
    const phase = [...rooms.values()].filter((candidate) => candidate.visited).length;
    const guaranteedBowDrop = phase === 3;
    room.cleared = true;
    if (room.kind === "boss") {
      room.items.push({ x: 5.5, y: 5.5, kind: "relic" });
      if (guaranteedBowDrop) room.items.push({ x: 5.5, y: 5.5, kind: "bow" });
      say(guaranteedBowDrop ? "O guardião caiu! Pegue o Café e a besta!" : "O guardião caiu! Pegue o Café!");
    }
    else if (guaranteedBowDrop) {
      room.items.push({ x: 5.5, y: 5.5, kind: "bow" });
      say("Sala limpa! A besta garantida está no chão...");
    }
    else if (Math.random() < 0.8) {
      const r = Math.random();
      const kind = r < 0.4 ? "heart" : r < 0.7 ? "sword" : r < 0.85 ? "boots" : "bow";
      room.items.push({ x: 5.5, y: 5.5, kind });
      say(kind === "bow" ? "Sala limpa! Uma besta está no chão..." : "Sala limpa! Algo brilha no chão...");
    } else say("Sala limpa!");
  }
  function removeDefeatedEnemies() {
    const survivors: Enemy[] = [];
    for (const enemy of room.enemies) {
      if (enemy.hp > 0) {
        survivors.push(enemy);
      } else if (Math.random() < HEAL_DROP_CHANCE) {
        room.items.push({ x: enemy.x, y: enemy.y, kind: "potion" });
      }
    }
    room.enemies = survivors;
  }
  function attack() {
    if (p.cd > 0 || status !== "play") return;
    p.atk = 0.18;
    if (p.weapon === "bow") {
      p.cd = 0.42;
      projectiles.push({ x: p.x + p.fx * 0.45, y: p.y + p.fy * 0.45, vx: p.fx * 10, vy: p.fy * 10, life: 1.2, owner: "player", damage: p.dmg });
      return;
    }
    p.cd = 0.35;
    for (const e of room.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d < 1.3 + e.r && (dx * p.fx + dy * p.fy) / (d || 1) > 0.2) {
        e.hp -= p.dmg; e.hit = 0.15; e.x += (dx / d) * 0.5; e.y += (dy / d) * 0.5;
      }
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
    const open = room.cleared;
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
    if (p.y < -0.2) go(0, -1, 5.5, W - 0.6);
    else if (p.y > W + 0.2) go(0, 1, 5.5, 0.6);
    else if (p.x < -0.2) go(-1, 0, W - 0.6, 5.5);
    else if (p.x > W + 0.2) go(1, 0, 0.6, 5.5);

    for (const e of room.enemies) {
      e.hit -= dt;
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.kind === "bat") {
        e.shotCd -= dt;
        if (e.shotCd <= 0) {
          projectiles.push({ x: e.x, y: e.y, vx: (dx / d) * 4.2, vy: (dy / d) * 4.2, life: 2.5, owner: "enemy", damage: 1 });
          e.shotCd = 1.8 + rnd(0, 0.4);
        }
        continue;
      }

      e.x += (dx / d) * e.spd * dt; e.y += (dy / d) * e.spd * dt;
      e.x = Math.max(0.5, Math.min(W - 0.5, e.x)); e.y = Math.max(0.5, Math.min(W - 0.5, e.y));
      if (d < e.r + 0.35) hurtPlayer(e.kind === "boss" ? 2 : 1, dx, dy);
    }
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const shot = projectiles[i]!;
      shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
      let hit = false;
      if (shot.owner === "player") {
        for (const e of room.enemies) {
          if (Math.hypot(e.x - shot.x, e.y - shot.y) > e.r + 0.2) continue;
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
      if (it.kind === "sword") { p.dmg += 1; say("Lâmina afiada! Dano +1"); }
      if (it.kind === "boots") { p.spd += 0.6; say("Botas ligeiras! Velocidade +"); }
      if (it.kind === "potion") { const healed = Math.min(HEAL_AMOUNT, p.maxHp - p.hp); p.hp += healed; say(`Poção! +${healed} de vida`); }
      if (it.kind === "bow") {
        if (p.hasBow) { p.dmg += 1; say("Besta reforçada! Dano +1"); }
        else { p.hasBow = true; p.weapon = "bow"; say("Besta equipada! Pressione Q para trocar de arma."); }
      }
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
    ox = cw / 2; oy = ch / 2 - (W * TH) / 2 + 20;
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
      const [sx, sy] = iso(x, y); const f = 0.7 + Math.sin(t / 90 + x) * 0.15;
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
        const size = { heart: 40, sword: 48, boots: 44, bow: 56, potion: 44, relic: 56 }[it.kind];
        if (it.kind === "relic") {
          const rg = ctx.createRadialGradient(sx, sy - 24, 2, sx, sy - 24, 40); rg.addColorStop(0, "rgba(255,220,90,0.7)"); rg.addColorStop(1, "rgba(255,220,90,0)"); ctx.fillStyle = rg; ctx.fillRect(sx - 40, sy - 64, 80, 80);
        }
        const sprite = ITEM_SPRITES[it.kind];
        if (sprite.complete && sprite.naturalWidth > 0) ctx.drawImage(sprite, sx - size / 2, sy - size + 4 + b, size, size);
      }
    });
    for (const e of room.enemies) list.push({
      d: e.x + e.y, draw: () => {
        const [sx, sy] = iso(e.x, e.y); const s = e.r * 40;
        const lift = e.kind === "bat" ? 26 + Math.sin(t / 100) * 5 : s * 0.7;
        shadow(sx, sy, s * 0.8);
        const img = SPR[e.kind]; const size = e.kind === "boss" ? 120 : e.kind === "bat" ? 80 : 76;
        const flip = e.x - e.y > p.x - p.y;
        ctx.save(); ctx.translate(sx, sy - lift + (e.kind === "bat" ? size / 2 : s * 0.7)); if (flip) ctx.scale(-1, 1);
        if (e.hit > 0) ctx.filter = "brightness(3)";
        if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, -size / 2, -size, size, size); ctx.restore();
        const lift2 = e.kind === "boss" ? size - s * 0.7 - 10 : 0;
        if (e.kind === "boss") { ctx.fillStyle = "#222"; ctx.fillRect(sx - 30, sy - lift - lift2 - s - 14, 60, 6); ctx.fillStyle = "#e84a5f"; ctx.fillRect(sx - 30, sy - lift - lift2 - s - 14, 60 * (e.hp / e.max), 6); }
      }
    });
    for (const shot of projectiles) list.push({
      d: shot.x + shot.y, draw: () => {
        const [sx, sy] = iso(shot.x, shot.y);
        const [vx, vy] = [(shot.vx - shot.vy) * TW / 2, (shot.vx + shot.vy) * TH / 2];
        if (shot.owner === "player" && SPR.arrow.complete && SPR.arrow.naturalWidth > 0) {
          ctx.save(); ctx.translate(sx, sy - 14); ctx.rotate(Math.atan2(vy, vx));
          ctx.drawImage(SPR.arrow, -24, -12, 62, 62); ctx.restore();
        } else if (shot.owner === "enemy" && SPR.bow.complete && SPR.bow.naturalWidth > 0) {
          ctx.save(); ctx.translate(sx, sy - 24); ctx.rotate(Math.atan2(vy, vx));
          ctx.drawImage(SPR.arrow, -21, -21, 62, 62); ctx.restore();
        }
      }
    });
    list.push({
      d: p.x + p.y, draw: () => {
        const [sx, sy] = iso(p.x, p.y); shadow(sx, sy, 13);
        if (p.inv > 0 && Math.floor(t / 80) % 2) return;
        const [hx] = [(p.fx - p.fy)];
        ctx.save(); ctx.translate(sx, sy + 4); if (hx < -0.05) ctx.scale(-1, 1);
        const heroSprite = p.weapon === "bow" ? SPR.heroRanged : SPR.hero;
        if (heroSprite.complete && heroSprite.naturalWidth > 0) ctx.drawImage(heroSprite, -38, -76, 76, 76); ctx.restore();
        const [fx, fy] = [(p.fx - p.fy) * TW / 2, (p.fx + p.fy) * TH / 2]; const fl = Math.hypot(fx, fy) || 1;
        const [cursorX, cursorY] = iso(p.x + p.fx * 1.45, p.y + p.fy * 1.45);
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(cursorX, cursorY + 2, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,212,71,0.95)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cursorX, cursorY, 9, 4.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#fff0b0"; ctx.beginPath(); ctx.arc(cursorX, cursorY, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (p.weapon === "melee" && p.atk > 0) {
          ctx.strokeStyle = "rgba(255,240,200,0.7)"; ctx.lineWidth = 3; const a = Math.atan2(fy, fx); ctx.beginPath(); ctx.arc(sx, sy - 20, 40, a - 0.9, a + 0.9); ctx.stroke(); ctx.lineWidth = 1;
        }
      }
    });
    list.sort((a, b) => a.d - b.d).forEach((x) => x.draw());
    // minimap
    const ms = 14, mx = cw - 20, my = 20;
    const xs = [...rooms.values()]; const minX = Math.min(...xs.map((r) => r.gx)), maxX = Math.max(...xs.map((r) => r.gx)), minY = Math.min(...xs.map((r) => r.gy));
    for (const r of xs) {
      if (!r.visited && ![...DIRS].some(([dx, dy]) => rooms.get(key(r.gx + dx, r.gy + dy))?.visited)) continue;
      ctx.fillStyle = r === room ? "#ffd447" : r.visited ? (r.kind === "boss" ? "#a8322d" : "#8a8494") : "#3a3640";
      ctx.fillRect(mx - (maxX - minX + 1) * ms + (r.gx - minX) * ms, my + (r.gy - minY) * ms, ms - 3, ms - 3);
    }
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT); ctx.fillStyle = "#f3e6c4"; ctx.font = "600 18px 'Cinzel', serif"; ctx.textAlign = "center"; ctx.fillText(msg, cw / 2, ch - 40); ctx.globalAlpha = 1; }
  }

  let last = performance.now(), raf = 0, hudT = 0;
  const loop = (t: number) => {
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    update(dt); render(t);
    hudT -= dt;
    if (hudT <= 0) { hudT = 0.1; onHud({ hp: p.hp, maxHp: p.maxHp, dmg: p.dmg, rooms: xsVisited(), total: rooms.size, weapon: p.weapon, hasBow: p.hasBow, status, msg }); }
    raf = requestAnimationFrame(loop);
  };
  const xsVisited = () => [...rooms.values()].filter((r) => r.visited).length;
  raf = requestAnimationFrame(loop);
  canvas.dataset["sceneReady"] = "1";
  return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); canvas.removeEventListener("pointerdown", click); };
}
