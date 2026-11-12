// Plain TS roguelike engine: logic + isometric canvas rendering.
export type HUD = { hp: number; maxHp: number; dmg: number; rooms: number; total: number; status: "play" | "dead" | "win"; msg: string };
type Enemy = { x: number; y: number; hp: number; max: number; spd: number; r: number; kind: "slime" | "bat" | "boss"; hit: number };
type Item = { x: number; y: number; kind: "heart" | "sword" | "boots" | "relic" };
type Room = { gx: number; gy: number; enemies: Enemy[]; items: Item[]; cleared: boolean; visited: boolean; kind: "start" | "normal" | "boss" };

const W = 11, TW = 64, TH = 32, WALL = 46;
const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function startGame(canvas: HTMLCanvasElement, onHud: (h: HUD) => void) {
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
  boss.enemies = [{ x: 5.5, y: 4, hp: 30, max: 30, spd: 1.3, r: 0.7, kind: "boss", hit: 0 }];
  boss.items = [];

  function mkRoom(gx: number, gy: number, kind: Room["kind"]): Room {
    const enemies: Enemy[] = [];
    if (kind === "normal") {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const bat = Math.random() < 0.4;
        enemies.push({ x: rnd(2, 9), y: rnd(2, 6), hp: bat ? 2 : 4, max: bat ? 2 : 4, spd: bat ? 2.6 : 1.2, r: 0.35, kind: bat ? "bat" : "slime", hit: 0 });
      }
    }
    return { gx, gy, enemies, items: [], cleared: kind === "start", visited: kind === "start", kind };
  }

  const p = { x: 5.5, y: 5.5, hp: 6, maxHp: 6, dmg: 1, spd: 3.2, fx: 0, fy: 1, atk: 0, cd: 0, inv: 0 };
  let room = rooms.get(key(0, 0))!;
  let status: HUD["status"] = "play";
  let msg = "Encontre o Cálice Ancestral no fim da masmorra!";
  let msgT = 4;
  const keys = new Set<string>();
  const kd = (e: KeyboardEvent) => { keys.add(e.key.toLowerCase()); if (e.key === " ") { e.preventDefault(); attack(); } };
  const ku = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  const click = () => attack();
  canvas.addEventListener("pointerdown", click);

  function say(m: string) { msg = m; msgT = 3; }
  function attack() {
    if (p.cd > 0 || status !== "play") return;
    p.atk = 0.18; p.cd = 0.35;
    for (const e of room.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d < 1.3 + e.r && (dx * p.fx + dy * p.fy) / (d || 1) > 0.2) {
        e.hp -= p.dmg; e.hit = 0.15; e.x += (dx / d) * 0.5; e.y += (dy / d) * 0.5;
      }
    }
    const before = room.enemies.length;
    room.enemies = room.enemies.filter((e) => e.hp > 0);
    if (before && !room.enemies.length && !room.cleared) {
      room.cleared = true;
      if (room.kind === "boss") { room.items.push({ x: 5.5, y: 5.5, kind: "relic" }); say("O guardião caiu! Pegue o Cálice!"); }
      else if (Math.random() < 0.8) {
        const r = Math.random();
        room.items.push({ x: 5.5, y: 5.5, kind: r < 0.5 ? "heart" : r < 0.8 ? "sword" : "boots" });
        say("Sala limpa! Algo brilha no chão...");
      } else say("Sala limpa!");
    }
  }

  function door(dir: number) {
    const [dx, dy] = DIRS[dir]!;
    return rooms.has(key(room.gx + dx, room.gy + dy));
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
      const wob = e.kind === "bat" ? Math.sin(performance.now() / 150 + e.max) * 0.8 : 0;
      e.x += ((dx / d) * e.spd + (-dy / d) * wob) * dt; e.y += ((dy / d) * e.spd + (dx / d) * wob) * dt;
      e.x = Math.max(0.5, Math.min(W - 0.5, e.x)); e.y = Math.max(0.5, Math.min(W - 0.5, e.y));
      if (d < e.r + 0.35 && p.inv <= 0) {
        p.hp -= e.kind === "boss" ? 2 : 1; p.inv = 0.8;
        p.x -= (dx / d) * -0.6; p.y -= (dy / d) * -0.6;
        if (p.hp <= 0) { p.hp = 0; status = "dead"; }
      }
    }
    room.items = room.items.filter((it) => {
      if (Math.hypot(it.x - p.x, it.y - p.y) > 0.6) return true;
      if (it.kind === "heart") { p.maxHp += 1; p.hp = p.maxHp; say("Coração! Vida máxima +1"); }
      if (it.kind === "sword") { p.dmg += 1; say("Lâmina afiada! Dano +1"); }
      if (it.kind === "boots") { p.spd += 0.6; say("Botas ligeiras! Velocidade +"); }
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
    if (canvas.width !== cw * dpr) { canvas.width = cw * dpr; canvas.height = ch * dpr; }
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
    for (const it of room.items) list.push({ d: it.x + it.y, draw: () => {
      const [sx, sy] = iso(it.x, it.y); const b = Math.sin(t / 250) * 4; shadow(sx, sy, 10);
      const c = { heart: "#e84a5f", sword: "#cfd8e3", boots: "#c58a4a", relic: "#ffd447" }[it.kind];
      if (it.kind === "relic") { const rg = ctx.createRadialGradient(sx, sy - 24, 2, sx, sy - 24, 40); rg.addColorStop(0, "rgba(255,220,90,0.7)"); rg.addColorStop(1, "rgba(255,220,90,0)"); ctx.fillStyle = rg; ctx.fillRect(sx - 40, sy - 64, 80, 80);
        poly([[sx - 9, sy - 34 + b], [sx + 9, sy - 34 + b], [sx + 4, sy - 20 + b], [sx + 6, sy - 10 + b], [sx - 6, sy - 10 + b], [sx - 4, sy - 20 + b]], c, "#7a5a00"); return; }
      if (it.kind === "sword") { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx - 8, sy - 10 + b); ctx.lineTo(sx + 8, sy - 30 + b); ctx.stroke(); ctx.lineWidth = 1; return; }
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx, sy - 18 + b, 8, 0, Math.PI * 2); ctx.fill();
    } });
    for (const e of room.enemies) list.push({ d: e.x + e.y, draw: () => {
      const [sx, sy] = iso(e.x, e.y); const s = e.r * 40;
      const lift = e.kind === "bat" ? 26 + Math.sin(t / 100) * 5 : s * 0.7;
      shadow(sx, sy, s * 0.8);
      const col = e.hit > 0 ? "#ffffff" : e.kind === "slime" ? "#5fbf6a" : e.kind === "bat" ? "#7b5ea8" : "#a8322d";
      ctx.fillStyle = col; ctx.beginPath();
      if (e.kind === "slime") ctx.ellipse(sx, sy - lift, s, s * (0.75 + Math.sin(t / 160 + e.x) * 0.08), 0, 0, Math.PI * 2);
      else ctx.arc(sx, sy - lift, s * (e.kind === "bat" ? 0.6 : 1), 0, Math.PI * 2);
      ctx.fill();
      if (e.kind === "bat") { const w = Math.sin(t / 50) * 6; poly([[sx - 4, sy - lift], [sx - 20, sy - lift - 6 + w], [sx - 12, sy - lift + 4]], col); poly([[sx + 4, sy - lift], [sx + 20, sy - lift - 6 + w], [sx + 12, sy - lift + 4]], col); }
      ctx.fillStyle = "#ffe97a"; ctx.fillRect(sx - s * 0.35, sy - lift - 3, 3, 3); ctx.fillRect(sx + s * 0.25, sy - lift - 3, 3, 3);
      if (e.kind === "boss") { ctx.fillStyle = "#222"; ctx.fillRect(sx - 30, sy - lift - s - 14, 60, 6); ctx.fillStyle = "#e84a5f"; ctx.fillRect(sx - 30, sy - lift - s - 14, 60 * (e.hp / e.max), 6); }
    } });
    list.push({ d: p.x + p.y, draw: () => {
      const [sx, sy] = iso(p.x, p.y); shadow(sx, sy, 13);
      if (p.inv > 0 && Math.floor(t / 80) % 2) return;
      ctx.fillStyle = "#2f5d8a"; ctx.fillRect(sx - 9, sy - 30, 18, 24);
      ctx.fillStyle = "#c9d3dd"; ctx.beginPath(); ctx.arc(sx, sy - 36, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d8a24a"; ctx.fillRect(sx - 9, sy - 18, 18, 3);
      const [fx, fy] = [(p.fx - p.fy) * TW / 2, (p.fx + p.fy) * TH / 2]; const fl = Math.hypot(fx, fy) || 1;
      const reach = p.atk > 0 ? 34 : 16;
      ctx.strokeStyle = "#e9eef3"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, sy - 20); ctx.lineTo(sx + (fx / fl) * reach, sy - 20 + (fy / fl) * reach); ctx.stroke(); ctx.lineWidth = 1;
      if (p.atk > 0) { ctx.strokeStyle = "rgba(255,240,200,0.7)"; ctx.lineWidth = 3; const a = Math.atan2(fy, fx); ctx.beginPath(); ctx.arc(sx, sy - 20, 40, a - 0.9, a + 0.9); ctx.stroke(); ctx.lineWidth = 1; }
    } });
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
    if (hudT <= 0) { hudT = 0.1; onHud({ hp: p.hp, maxHp: p.maxHp, dmg: p.dmg, rooms: xsVisited(), total: rooms.size, status, msg }); }
    raf = requestAnimationFrame(loop);
  };
  const xsVisited = () => [...rooms.values()].filter((r) => r.visited).length;
  raf = requestAnimationFrame(loop);
  canvas.dataset["sceneReady"] = "1";
  return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); canvas.removeEventListener("pointerdown", click); };
}
