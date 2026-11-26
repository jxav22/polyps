/**
 * Polyps ColonyRenderer — single-file browser build (no bundler).
 * Mirrors the TypeScript modules for instant demos / copy-paste.
 *
 *   <script src="./colony-viz.standalone.js"></script>
 *   <script>
 *     const { ColonyRenderer, DEMO_SNAPSHOT } = PolypsViz;
 *     const r = new ColonyRenderer(document.querySelector("#colony"));
 *     r.setSnapshot(DEMO_SNAPSHOT);
 *     requestAnimationFrame(function loop(ms){ r.draw(ms/1000); requestAnimationFrame(loop); });
 *   </script>
 */
(function (global) {
  "use strict";

  const DEPTH = { abyss: "#02060c", deep: "#061018", mid: "#0a1c28", shallows: "#0e2a36" };
  const ARCHETYPE_HUE = {
    core: 185, tentacle: 168, chamber: 210, symbiont: 95, membrane: 195,
    bud: 145, sensor: 280, vessel: 200, venom: 330, bacteria: 55,
  };
  const ARCHETYPE_RADIUS = {
    core: 28, tentacle: 16, chamber: 22, symbiont: 14, membrane: 20,
    bud: 12, sensor: 13, vessel: 10, venom: 15, bacteria: 11,
  };

  function hsla(h, s, l, a) {
    return "hsla(" + (((h % 360) + 360) % 360) + ", " + s + "%, " + l + "%, " + (a == null ? 1 : a) + ")";
  }
  function glowColor(hue, alpha, lightness) {
    return hsla(hue, 78, lightness == null ? 62 : lightness, alpha == null ? 1 : alpha);
  }
  function membraneColor(hue, alpha) {
    return hsla(hue, 45, 42, alpha == null ? 0.35 : alpha);
  }
  function causticColor(light, alpha) {
    return "rgba(90, 210, 230, " + (alpha * (0.35 + light * 0.65)) + ")";
  }
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // ——— layout ———
  function layoutColony(nodes, edges, worldRadius) {
    if (!nodes.length) return [];
    worldRadius = worldRadius || 220;
    const core = nodes.find(function (n) { return n.archetype === "core"; }) || nodes[0];
    const byId = new Map(nodes.map(function (n) { return [n.id, n]; }));
    const laid = new Map();
    const edgeList = edges || nodes.flatMap(function (n) {
      return n.neighbors.filter(function (nid) { return byId.has(nid) && n.id < nid; })
        .map(function (nid) { return { from: n.id, to: nid, flow: 0.5 }; });
    });

    const ring = new Map();
    const queue = [core.id];
    ring.set(core.id, 0);
    while (queue.length) {
      const id = queue.shift();
      const n = byId.get(id);
      const r = ring.get(id);
      (n.neighbors || []).forEach(function (nid) {
        if (!ring.has(nid) && byId.has(nid)) {
          ring.set(nid, r + 1);
          queue.push(nid);
        }
      });
    }
    nodes.forEach(function (n) {
      if (!ring.has(n.id)) ring.set(n.id, 2 + Math.floor(hash(n.id) * 2));
    });
    const maxRing = Math.max(1, ...ring.values());
    const byRing = new Map();
    nodes.forEach(function (n) {
      const r = ring.get(n.id);
      if (!byRing.has(r)) byRing.set(r, []);
      byRing.get(r).push(n);
    });

    byRing.forEach(function (group, r) {
      group.sort(function (a, b) { return a.id.localeCompare(b.id); });
      const count = group.length;
      const radius = r === 0 ? 0 : worldRadius * 0.28 + (worldRadius * 0.55 * r) / maxRing;
      group.forEach(function (n, i) {
        const jitter = (hash(n.id) - 0.5) * 0.35;
        const angle = r === 0 ? 0 : ((i + 0.5) / count) * Math.PI * 2 + jitter + hash(core.id + ":spin") * Math.PI * 2;
        const radJitter = r === 0 ? 0 : (hash(n.id + "r") - 0.5) * 18;
        const pos = r === 0 ? { x: 0, y: 0 } : {
          x: Math.cos(angle) * (radius + radJitter),
          y: Math.sin(angle) * (radius + radJitter),
        };
        const baseR = ARCHETYPE_RADIUS[n.archetype] || 14;
        const growth = n.growth == null ? 1 : n.growth;
        laid.set(n.id, Object.assign({}, n, {
          pos: pos, radius: baseR * (0.55 + 0.45 * growth), angle: angle,
        }));
      });
    });

    const arr = Array.from(laid.values());
    for (let iter = 0; iter < 28; iter++) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j];
          const d = dist(a.pos, b.pos) || 0.01;
          const minD = a.radius + b.radius + 14;
          if (d < minD) {
            const push = ((minD - d) / d) * 0.45;
            const dx = (a.pos.x - b.pos.x) * push;
            const dy = (a.pos.y - b.pos.y) * push;
            if (a.archetype !== "core") { a.pos.x += dx; a.pos.y += dy; }
            if (b.archetype !== "core") { b.pos.x -= dx; b.pos.y -= dy; }
          }
        }
      }
      edgeList.forEach(function (e) {
        const a = laid.get(e.from), b = laid.get(e.to);
        if (!a || !b) return;
        const d = dist(a.pos, b.pos) || 0.01;
        const ideal = a.radius + b.radius + 36;
        const pull = (d - ideal) * 0.04;
        const dx = ((b.pos.x - a.pos.x) / d) * pull;
        const dy = ((b.pos.y - a.pos.y) / d) * pull;
        if (a.archetype !== "core") { a.pos.x += dx; a.pos.y += dy; }
        if (b.archetype !== "core") { b.pos.x -= dx; b.pos.y -= dy; }
      });
    }
    return arr;
  }

  function hitTest(nodes, world, pad) {
    pad = pad == null ? 4 : pad;
    let best = null, bestD = Infinity;
    nodes.forEach(function (n) {
      const d = dist(n.pos, world);
      if (d <= n.radius + pad && d < bestD) { best = n; bestD = d; }
    });
    return best;
  }

  function buildEdgesFromNodes(nodes) {
    const seen = new Set();
    const edges = [];
    nodes.forEach(function (n) {
      (n.neighbors || []).forEach(function (nid) {
        const key = n.id < nid ? n.id + "|" + nid : nid + "|" + n.id;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({ from: n.id, to: nid, flow: 0.4 + hash(key) * 0.5 });
      });
    });
    return edges;
  }

  // ——— background ———
  function spawnMote(w, h, lifeBias) {
    return {
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 6 - 2,
      life: (lifeBias || 0) + Math.random() * 6, maxLife: 6 + Math.random() * 10,
      hue: 170 + Math.random() * 40, size: 0.6 + Math.random() * 2.2, kind: "mote",
    };
  }
  function createBackground(w, h, count) {
    const motes = [];
    for (let i = 0; i < (count || 48); i++) motes.push(spawnMote(w, h, Math.random() * 8));
    return { motes: motes, time: 0 };
  }
  function updateBackground(bg, dt, w, h, current) {
    bg.time += dt;
    const drift = (current || 0.3) * 18;
    bg.motes.forEach(function (m) {
      m.life += dt;
      m.x += (m.vx + drift) * dt;
      m.y += m.vy * dt;
      m.vx += Math.sin(bg.time * 0.4 + m.y * 0.01) * 2 * dt;
      if (m.life > m.maxLife || m.x < -20 || m.x > w + 20 || m.y < -20 || m.y > h + 20) {
        Object.assign(m, spawnMote(w, h));
        m.life = 0;
      }
    });
  }
  function drawBackground(ctx, bg, w, h, light, disturbance) {
    light = light == null ? 0.5 : light;
    disturbance = disturbance || 0;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    g.addColorStop(0, DEPTH.shallows);
    g.addColorStop(0.45, DEPTH.mid);
    g.addColorStop(0.82, DEPTH.deep);
    g.addColorStop(1, DEPTH.abyss);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const murk = ctx.createLinearGradient(0, 0, 0, h);
    murk.addColorStop(0, "rgba(4, 20, 32, 0.15)");
    murk.addColorStop(0.55, "rgba(0, 0, 0, 0)");
    murk.addColorStop(1, "rgba(0, 4, 10, 0.55)");
    ctx.fillStyle = murk;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const t = bg.time;
    for (let i = 0; i < 3; i++) {
      const cx = w * (0.2 + i * 0.3) + Math.sin(t * 0.15 + i) * 40;
      const curtain = ctx.createRadialGradient(cx, h * 0.35, 10, cx, h * 0.5, h * 0.55);
      const hue = 175 + i * 35;
      curtain.addColorStop(0, "hsla(" + hue + ", 70%, 55%, " + (0.04 + light * 0.05) + ")");
      curtain.addColorStop(0.5, "hsla(" + (hue + 20) + ", 60%, 40%, " + (0.02 + light * 0.03) + ")");
      curtain.addColorStop(1, "hsla(200, 50%, 20%, 0)");
      ctx.fillStyle = curtain;
      ctx.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const amp = 10 + i * 4 + disturbance * 12;
      const y0 = h * (0.18 + i * 0.12);
      ctx.moveTo(0, y0);
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + Math.sin(x * 0.012 + t * (0.55 + i * 0.07) + i) * amp +
          Math.sin(x * 0.031 - t * 0.4 + i * 1.7) * (amp * 0.35);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = causticColor(light, 0.045 + i * 0.008);
      ctx.lineWidth = 1.2 + light * 1.5;
      ctx.stroke();
    }
    bg.motes.forEach(function (m) {
      const fade = Math.sin((m.life / m.maxLife) * Math.PI);
      const a = 0.15 + fade * 0.45 * (0.4 + light * 0.6);
      ctx.beginPath();
      ctx.fillStyle = "hsla(" + m.hue + ", 70%, 70%, " + a + ")";
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    if (disturbance > 0.08) {
      ctx.fillStyle = "rgba(60, 30, 70, " + (disturbance * 0.16) + ")";
      ctx.fillRect(0, 0, w, h);
    }

        const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,2,6,0.72)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  // ——— archetypes ———
  function pulseScale(node, time) {
    const p = node.pulse || 1;
    return 1 + Math.sin(time * (1.4 + p) + node.angle) * 0.06 * p;
  }
  function blobPath(ctx, x, y, r, lobes, time, seed) {
    ctx.beginPath();
    const steps = lobes * 8;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const wobble = 1 + 0.12 * Math.sin(t * lobes + time * 1.2 + seed) +
        0.05 * Math.sin(t * (lobes + 2) - time * 0.8);
      const px = x + Math.cos(t) * r * wobble;
      const py = y + Math.sin(t) * r * wobble;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function fillGlow(ctx, x, y, r, hue, alpha) {
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.6);
    g.addColorStop(0, glowColor(hue, alpha * 0.85, 72));
    g.addColorStop(0.45, glowColor(hue, alpha * 0.35, 55));
    g.addColorStop(1, glowColor(hue, 0, 40));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawConnection(ctx, a, b, time, flow) {
    flow = flow == null ? 0.4 : flow;
    const mx = (a.pos.x + b.pos.x) / 2, my = (a.pos.y + b.pos.y) / 2;
    const nx = -(b.pos.y - a.pos.y), ny = b.pos.x - a.pos.x;
    const len = Math.hypot(nx, ny) || 1;
    const bend = Math.sin(time * 0.7 + a.angle) * 12;
    const cx = mx + (nx / len) * bend, cy = my + (ny / len) * bend;
    ctx.beginPath();
    ctx.moveTo(a.pos.x, a.pos.y);
    ctx.quadraticCurveTo(cx, cy, b.pos.x, b.pos.y);
    ctx.strokeStyle = membraneColor((a.hue + b.hue) / 2, 0.25 + flow * 0.25);
    ctx.lineWidth = 2 + flow * 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.pos.x, a.pos.y);
    ctx.quadraticCurveTo(cx, cy, b.pos.x, b.pos.y);
    ctx.strokeStyle = glowColor((a.hue + b.hue) / 2, 0.12 + flow * 0.2, 70);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const drawers = {
    core: function (ctx, node, time) {
      const s = pulseScale(node, time), x = node.pos.x, y = node.pos.y, r = node.radius * s;
      ctx.beginPath();
      ctx.arc(x, y, r * (1.55 + Math.sin(time * 2.2) * 0.08), 0, Math.PI * 2);
      ctx.strokeStyle = glowColor(node.hue, 0.18 + Math.sin(time * 2.2) * 0.08, 70);
      ctx.lineWidth = 2; ctx.stroke();
      fillGlow(ctx, x, y, r, node.hue, 0.55);
      blobPath(ctx, x, y, r, 5, time, 1); ctx.fillStyle = membraneColor(node.hue, 0.55); ctx.fill();
      blobPath(ctx, x, y, r * 0.55, 3, time * 1.2, 2); ctx.fillStyle = glowColor(node.hue, 0.7, 68); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, Math.PI * 2); ctx.fillStyle = glowColor(node.hue + 20, 0.95, 85); ctx.fill();
    },
    tentacle: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, len = node.radius * 2.8 * (node.growth == null ? 1 : node.growth);
      fillGlow(ctx, x, y, node.radius * 0.7, node.hue, 0.35);
      for (let t = 0; t < 3; t++) {
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let i = 1; i <= 8; i++) {
          const u = i / 8;
          const wave = Math.sin(time * 2.2 + u * 4 + t) * (6 + t * 2) * u;
          const ang = node.angle + (t - 1) * 0.35 + wave * 0.04;
          ctx.lineTo(x + Math.cos(ang) * len * u, y + Math.sin(ang) * len * u);
        }
        ctx.strokeStyle = glowColor(node.hue + t * 8, 0.55 - t * 0.1, 60);
        ctx.lineWidth = (4 - t) * (node.growth == null ? 1 : node.growth);
        ctx.lineCap = "round"; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, node.radius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = membraneColor(node.hue, 0.6); ctx.fill();
    },
    chamber: function (ctx, node, time) {
      const s = pulseScale(node, time), x = node.pos.x, y = node.pos.y, r = node.radius * s;
      fillGlow(ctx, x, y, r, node.hue, 0.4);
      blobPath(ctx, x, y, r, 4, time, 3); ctx.fillStyle = membraneColor(node.hue, 0.4); ctx.fill();
      ctx.strokeStyle = glowColor(node.hue, 0.5, 65); ctx.lineWidth = 1.5; ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = time * 1.5 + i * 1.2, rr = r * (0.25 + (i % 3) * 0.12);
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a * 1.3) * rr * 0.7, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowColor(node.hue + 30, 0.55, 70); ctx.fill();
      }
    },
    symbiont: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, r = node.radius * pulseScale(node, time);
      fillGlow(ctx, x, y, r * 1.1, node.hue, 0.5 + Math.sin(time * 2) * 0.1);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time * 0.4;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = glowColor(node.hue, 0.65, 68); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = glowColor(node.hue + 15, 0.85, 78); ctx.fill();
    },
    membrane: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, r = node.radius * (1.15 + Math.sin(time * 1.1) * 0.04);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * Math.PI * 2;
        const wob = 1 + 0.08 * Math.sin(t * 3 + time);
        const px = x + Math.cos(t) * r * wob, py = y + Math.sin(t) * r * wob;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = glowColor(node.hue, 0.55, 62); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = membraneColor(node.hue, 0.18); ctx.fill();
    },
    bud: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, g = node.growth == null ? 1 : node.growth;
      const r = node.radius * pulseScale(node, time);
      fillGlow(ctx, x, y, r, node.hue, 0.4);
      ctx.beginPath(); ctx.arc(x - r * 0.25, y, r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = membraneColor(node.hue, 0.55); ctx.fill();
      ctx.beginPath(); ctx.arc(x + r * 0.45 * g, y - r * 0.1, r * 0.45 * g, 0, Math.PI * 2);
      ctx.fillStyle = glowColor(node.hue + 20, 0.7, 70); ctx.fill();
    },
    sensor: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, r = node.radius * pulseScale(node, time);
      fillGlow(ctx, x, y, r, node.hue, 0.45);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fillStyle = membraneColor(node.hue, 0.5); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = glowColor(node.hue, 0.8, 55); ctx.fill();
      ctx.beginPath(); ctx.arc(x + Math.cos(time) * 2, y, r * (0.18 + Math.sin(time * 3) * 0.04), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(4, 10, 18, 0.9)"; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r * (1.1 + Math.sin(time * 2.5) * 0.08), 0, Math.PI * 1.4);
      ctx.strokeStyle = glowColor(node.hue, 0.45, 75); ctx.lineWidth = 1.2; ctx.stroke();
    },
    vessel: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, r = node.radius;
      fillGlow(ctx, x, y, r, node.hue, 0.3);
      ctx.save(); ctx.translate(x, y); ctx.rotate(node.angle + Math.sin(time) * 0.1);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.4, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = membraneColor(node.hue, 0.55); ctx.fill();
      ctx.strokeStyle = glowColor(node.hue, 0.5, 68); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
    },
    venom: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, r = node.radius * pulseScale(node, time);
      fillGlow(ctx, x, y, r, node.hue, 0.4);
      blobPath(ctx, x, y, r * 0.85, 6, time, 9); ctx.fillStyle = membraneColor(node.hue, 0.55); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + node.angle;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
        ctx.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35);
        ctx.strokeStyle = glowColor(node.hue, 0.7, 58); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
      }
      const drip = (time * 0.6) % 1;
      ctx.beginPath(); ctx.arc(x, y + r * (0.6 + drip * 0.8), 2, 0, Math.PI * 2);
      ctx.fillStyle = glowColor(node.hue, 0.6 * (1 - drip), 60); ctx.fill();
    },
    bacteria: function (ctx, node, time) {
      const x = node.pos.x, y = node.pos.y, r = node.radius;
      fillGlow(ctx, x, y, r, node.hue, 0.3);
      ctx.beginPath(); ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = membraneColor(node.hue, 0.4); ctx.lineWidth = 1; ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = time * 1.8 + i * 0.9, orbit = r * (0.25 + (i % 3) * 0.15);
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * orbit, y + Math.sin(a * 1.1) * orbit, 3.2, 1.8, a, 0, Math.PI * 2);
        ctx.fillStyle = glowColor(node.hue + i * 5, 0.7, 65); ctx.fill();
      }
    },
  };

  function drawArchetype(ctx, node, time, selectedId) {
    (drawers[node.archetype] || drawers.core)(ctx, node, time);
    if (selectedId === node.id) {
      ctx.beginPath();
      ctx.arc(node.pos.x, node.pos.y, node.radius * 1.45 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = glowColor(node.hue, 0.65, 80); ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  // ——— particles ———
  function spawnFlash(at, hue, time, strength, kind) {
    return { x: at.x, y: at.y, hue: hue, born: time, duration: (kind === "select" ? 0.35 : 0.55 + (strength || 1) * 0.25), strength: strength || 1, kind: kind || "upgrade" };
  }
  function spawnSparks(at, hue, n) {
    const out = [];
    for (let i = 0; i < (n || 12); i++) {
      const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 80;
      out.push({
        x: at.x, y: at.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, maxLife: 0.35 + Math.random() * 0.4,
        hue: hue + (Math.random() - 0.5) * 30, size: 1.5 + Math.random() * 2.5, kind: "spark",
      });
    }
    return out;
  }
  function updateParticles(particles, dt) {
    const next = [];
    particles.forEach(function (p) {
      p.life += dt;
      if (p.life >= p.maxLife) return;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === "spark") { p.vx *= 0.92; p.vy *= 0.92; p.vy += 20 * dt; }
      if (p.kind === "nutrient") { p.vx += Math.sin(p.life * 8) * 8 * dt; p.vy += Math.cos(p.life * 7) * 8 * dt; }
      next.push(p);
    });
    return next;
  }
  function drawParticles(ctx, particles) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    particles.forEach(function (p) {
      const fade = 1 - p.life / p.maxLife;
      ctx.beginPath();
      ctx.fillStyle = glowColor(p.hue, fade * (p.kind === "spark" ? 0.9 : 0.55), 72);
      ctx.arc(p.x, p.y, p.size * (0.6 + fade * 0.6), 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
  function drawFlashes(ctx, flashes, time) {
    const live = [];
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    flashes.forEach(function (f) {
      const u = (time - f.born) / f.duration;
      if (u >= 1 || u < 0) return;
      live.push(f);
      const ease = 1 - Math.pow(1 - Math.min(1, u), 2);
      const fade = 1 - u;
      const kind = f.kind || "upgrade";
      const r = (kind === "select" ? 14 : 22) + ease * (kind === "birth" ? 90 : 75) * f.strength;
      const a = fade * (kind === "select" ? 0.4 : 0.65) * f.strength;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, glowColor(f.hue, a, 90));
      g.addColorStop(0.35, glowColor(f.hue + 25, a * 0.5, 72));
      g.addColorStop(1, glowColor(f.hue, 0, 50));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
      const ringR = 8 + ease * (55 + f.strength * 40);
      ctx.beginPath(); ctx.arc(f.x, f.y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = glowColor(f.hue, fade * 0.75 * f.strength, 80);
      ctx.lineWidth = 2.2 * fade + 0.5; ctx.stroke();
    });
    ctx.restore();
    return live;
  }
  function bezierPoint(a, c, b, u) {
    const omu = 1 - u;
    return { x: omu*omu*a.x + 2*omu*u*c.x + u*u*b.x, y: omu*omu*a.y + 2*omu*u*c.y + u*u*b.y };
  }
  function edgeControl(a, b, time) {
    const mx = (a.pos.x + b.pos.x) / 2, my = (a.pos.y + b.pos.y) / 2;
    const nx = -(b.pos.y - a.pos.y), ny = b.pos.x - a.pos.x;
    const len = Math.hypot(nx, ny) || 1;
    const bend = Math.sin(time * 0.7 + a.angle) * 12;
    return { x: mx + (nx / len) * bend, y: my + (ny / len) * bend };
  }
  function drawFlowBeads(ctx, a, b, time, flow) {
    const c = edgeControl(a, b, time);
    const wasteLoop = (a.archetype === "chamber" && b.archetype === "bacteria") ||
      (b.archetype === "chamber" && a.archetype === "bacteria") ||
      a.archetype === "bacteria" || b.archetype === "bacteria";
    const photo = a.archetype === "symbiont" || b.archetype === "symbiont";
    const hue = wasteLoop ? 38 : photo ? 95 : 175;
    const n = 3 + Math.floor(flow * 3);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const u = (time * (0.4 + flow * 0.5) + i / n) % 1;
      const pt = bezierPoint(a.pos, c, b.pos, u);
      const p2 = bezierPoint(a.pos, c, b.pos, Math.min(0.999, u + 0.04));
      const ang = Math.atan2(p2.y - pt.y, p2.x - pt.x);
      ctx.beginPath(); ctx.fillStyle = glowColor(hue, 0.45 + flow * 0.4, 80);
      ctx.arc(pt.x, pt.y, 2.2 + flow * 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(4.5, 0); ctx.lineTo(-1.5, 3); ctx.lineTo(-1.5, -3); ctx.closePath();
      ctx.fillStyle = glowColor(hue, 0.55 + flow * 0.3, 88); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  function drawBuildConduit(ctx, parent, child, progress, time) {
    const p = Math.max(0, Math.min(1, progress));
    const ease = 1 - Math.pow(1 - p, 2);
    const c = edgeControl(parent, child, time);
    const hue = child.hue;
    ctx.save(); ctx.lineCap = "round"; ctx.globalCompositeOperation = "lighter";
    ctx.beginPath(); ctx.moveTo(parent.pos.x, parent.pos.y);
    ctx.quadraticCurveTo(c.x, c.y, child.pos.x, child.pos.y);
    ctx.strokeStyle = glowColor(hue, 0.12, 70); ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = (i / 16) * ease;
      const pt = bezierPoint(parent.pos, c, child.pos, u);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = glowColor(hue, 0.35 + ease * 0.45, 78);
    ctx.lineWidth = 2.5 + ease * 2; ctx.stroke();
    const tip = bezierPoint(parent.pos, c, child.pos, ease);
    const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 14);
    g.addColorStop(0, glowColor(hue, 0.7, 90)); g.addColorStop(1, glowColor(hue, 0, 60));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tip.x, tip.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function syncEdgeFlows(particles, nodes, edges, dt, scale) {
    let list = updateParticles(particles, dt);
    const byId = new Map(nodes.map(function (n) { return [n.id, n]; }));
    const nutrients = list.filter(function (p) { return p.kind === "nutrient"; }).length;
    const target = Math.floor(edges.length * 3 * (scale || 1));
    if (nutrients < target && edges.length) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      const a = byId.get(e.from), b = byId.get(e.to);
      if (a && b) {
        const wasteLoop = (a.archetype === "chamber" && b.archetype === "bacteria") ||
          (b.archetype === "chamber" && a.archetype === "bacteria") ||
          a.archetype === "bacteria" || b.archetype === "bacteria";
        const kind = wasteLoop && Math.random() < 0.45 ? "waste" : "nutrient";
        const hue = kind === "waste" ? 38 : (a.hue + b.hue) / 2;
        const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = 35 + (e.flow || 0.5) * 40;
        list.push({
          x: a.pos.x, y: a.pos.y, vx: (dx / len) * speed, vy: (dy / len) * speed,
          life: 0, maxLife: 1.2 + Math.random() * 0.8,
          hue: hue, size: (1.5 + Math.random() * 2) * (kind === "waste" ? 1.15 : 1), kind: kind,
        });
      }
    }
    return list;
  }

  // ——— renderer ———
  function ColonyRenderer(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("ColonyRenderer: 2d context unavailable");
    this.opts = {
      worldRadius: options.worldRadius || 220,
      showVessels: options.showVessels !== false,
      particleScale: options.particleScale || 1,
      interactive: options.interactive !== false,
    };
    this.bg = createBackground(canvas.width || 800, canvas.height || 600);
    this.snapshot = null;
    this.laid = [];
    this.edges = [];
    this.particles = [];
    this.flashes = [];
    this.selectedId = null;
    this.hoverId = null;
    this.time = 0;
    this.dpr = 1;
    this.onClick = null;
    this.growing = new Map();
    this.lastT = null;
    this.resize();
    if (this.opts.interactive) this._bindPointer();
  }

  ColonyRenderer.prototype.setOptions = function (partial) {
    Object.assign(this.opts, partial);
  };
  ColonyRenderer.prototype.onNodeClick = function (handler) {
    this.onClick = handler;
  };
  ColonyRenderer.prototype.setSnapshot = function (snap) {
    const prev = new Set(this.laid.map(function (n) { return n.id; }));
    this.snapshot = snap;
    this.edges = snap.edges && snap.edges.length ? snap.edges : buildEdgesFromNodes(snap.nodes);
    const self = this;
    snap.nodes.forEach(function (n) {
      if (!prev.has(n.id) && !self.growing.has(n.id)) self.growing.set(n.id, 0);
      if (n.growth != null && n.growth < 1) self.growing.set(n.id, n.growth);
    });
    const nodes = snap.nodes.map(function (n) {
      return Object.assign({}, n, { growth: self.growing.has(n.id) ? self.growing.get(n.id) : (n.growth == null ? 1 : n.growth) });
    });
    this.laid = layoutColony(nodes, this.edges, this.opts.worldRadius);
  };
  ColonyRenderer.prototype.flashNode = function (nodeId, strength, kind) {
    const n = this.laid.find(function (x) { return x.id === nodeId; });
    if (!n) return;
    kind = kind || "upgrade";
    this.flashes.push(spawnFlash(n.pos, n.hue, this.time, strength || 1, kind));
    if (kind !== "select") this.particles = this.particles.concat(spawnSparks(n.pos, n.hue, Math.floor(10 + (strength || 1) * 10)));
  };
  ColonyRenderer.prototype.flashAt = function (x, y, hue, strength) {
    this.flashes.push(spawnFlash({ x: x, y: y }, hue || 180, this.time, strength || 1));
    this.particles = this.particles.concat(spawnSparks({ x: x, y: y }, hue || 180, 14));
  };
  ColonyRenderer.prototype.getSelectedId = function () { return this.selectedId; };
  ColonyRenderer.prototype.setSelectedId = function (id) { this.selectedId = id; };
  ColonyRenderer.prototype.getLaidNodes = function () { return this.laid; };

  ColonyRenderer.prototype.resize = function () {
    const parent = this.canvas.parentElement;
    const cssW = (parent && parent.clientWidth) || this.canvas.clientWidth || 800;
    const cssH = (parent && parent.clientHeight) || this.canvas.clientHeight || 600;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(cssW * this.dpr);
    this.canvas.height = Math.floor(cssH * this.dpr);
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.bg = createBackground(cssW, cssH, Math.floor(40 + (cssW * cssH) / 20000));
  };

  ColonyRenderer.prototype.screenToWorld = function (clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  };

  ColonyRenderer.prototype._bindPointer = function () {
    const self = this;
    this.canvas.addEventListener("pointermove", function (e) {
      const w = self.screenToWorld(e.clientX, e.clientY);
      const hit = hitTest(self.laid, w);
      self.hoverId = hit ? hit.id : null;
      self.canvas.style.cursor = hit ? "pointer" : "default";
    });
    this.canvas.addEventListener("pointerdown", function (e) {
      const w = self.screenToWorld(e.clientX, e.clientY);
      const hit = hitTest(self.laid, w);
      self.selectedId = hit ? hit.id : null;
      if (hit) self.flashNode(hit.id, 0.7, "select");
      if (self.onClick) self.onClick(hit, e);
    });
  };

  ColonyRenderer.prototype._tickGrowth = function (dt) {
    if (!this.growing.size || !this.snapshot) return;
    let dirty = false;
    const self = this;
    Array.from(this.growing.entries()).forEach(function (pair) {
      const id = pair[0], g = pair[1];
      const next = Math.min(1, g + dt * 1.6);
      if (next >= 1) { self.growing.delete(id); dirty = true; }
      else { self.growing.set(id, next); dirty = true; }
    });
    if (dirty) {
      const nodes = this.snapshot.nodes.map(function (n) {
        return Object.assign({}, n, { growth: self.growing.has(n.id) ? self.growing.get(n.id) : (n.growth == null ? 1 : n.growth) });
      });
      this.laid = layoutColony(nodes, this.edges, this.opts.worldRadius);
    }
  };

  ColonyRenderer.prototype.draw = function (timeSeconds) {
    const t = timeSeconds;
    const dt = this.lastT == null ? 1 / 60 : Math.min(0.05, Math.max(0, t - this.lastT));
    this.lastT = t;
    this.time = t;
    const w = this.canvas.clientWidth || this.canvas.width / this.dpr;
    const h = this.canvas.clientHeight || this.canvas.height / this.dpr;
    const env = (this.snapshot && this.snapshot.env) || {};
    const light = env.light == null ? 0.55 : env.light;
    const current = env.current == null ? 0.3 : env.current;
    const disturbance = env.disturbance || 0;

    this._tickGrowth(dt);
    updateBackground(this.bg, dt, w, h, current);
    this.particles = syncEdgeFlows(this.particles, this.laid, this.edges, dt, this.opts.particleScale);

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    drawBackground(ctx, this.bg, w, h, light, disturbance);
    ctx.translate(w / 2, h / 2);
    const sway = Math.sin(t * 0.35) * (2 + current * 4);
    const jitter = disturbance > 0.05
      ? Math.sin(t * 18) * disturbance * 3.5 + Math.cos(t * 23.5) * disturbance * 2.2
      : 0;
    const breath = 1 + Math.sin(t * 0.9) * 0.008;
    ctx.rotate(sway * 0.002 + jitter * 0.001);
    ctx.translate(sway * 0.3 + jitter, Math.cos(t * 0.28) * 1.5 + jitter * 0.4);
    ctx.scale(breath, breath);

    if (this.laid.length) {
      var cx = 0, cy = 0;
      this.laid.forEach(function (n) { cx += n.pos.x; cy += n.pos.y; });
      cx /= this.laid.length; cy /= this.laid.length;
      var pool = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
      pool.addColorStop(0, "rgba(46, 230, 200, 0.07)");
      pool.addColorStop(0.5, "rgba(60, 140, 200, 0.03)");
      pool.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(cx, cy, 160, 0, Math.PI * 2); ctx.fill();
    }
    if (this.opts.showVessels) {
      const self = this;
      this.edges.forEach(function (e) {
        const a = self.laid.find(function (n) { return n.id === e.from; });
        const b = self.laid.find(function (n) { return n.id === e.to; });
        if (a && b) {
          var aG = a.growth == null ? 1 : a.growth, bG = b.growth == null ? 1 : b.growth;
          if (aG > 0.55 && bG > 0.55) {
            drawConnection(ctx, a, b, t, e.flow || 0.45);
            drawFlowBeads(ctx, a, b, t, e.flow || 0.45);
          }
        }
      });
    }

    (function () {
      var self = this;
      self.laid.forEach(function (child) {
        var g = child.growth == null ? 1 : child.growth;
        if (g >= 0.98) return;
        var parent = null;
        (child.neighbors || []).forEach(function (nid) {
          var n = self.laid.find(function (x) { return x.id === nid; });
          if (n && (n.growth == null ? 1 : n.growth) > 0.9) parent = n;
        });
        if (!parent) parent = self.laid.find(function (n) { return n.archetype === "core" && n.id !== child.id; });
        if (parent) drawBuildConduit(ctx, parent, child, g, t);
      });
    }).call(this);

    const order = this.laid.slice().sort(function (a, b) {
      if (a.archetype === "core") return 1;
      if (b.archetype === "core") return -1;
      return a.radius - b.radius;
    });
    const selected = this.selectedId || this.hoverId;
    const self = this;
    order.forEach(function (n) {
      if (n.id === self.hoverId && n.id !== self.selectedId) {
        ctx.save(); ctx.globalAlpha = 0.9;
        drawArchetype(ctx, Object.assign({}, n, { pulse: n.pulse * 1.25 }), t, selected);
        ctx.restore();
      } else {
        drawArchetype(ctx, n, t, selected);
      }
    });

    drawParticles(ctx, this.particles);
    this.flashes = drawFlashes(ctx, this.flashes, t);
    ctx.restore();
  };

  function vizNodesFromSim(structures, defsById) {
    const idBySlot = new Map(structures.map(function (s) { return [s.slot, s.id]; }));
    return structures.map(function (s) {
      const defVis = defsById && defsById[s.defId] && defsById[s.defId].visual;
      const vis = s.visual || defVis || {};
      const archetype = vis.archetype || "core";
      return {
        id: s.id, defId: s.defId, archetype: archetype,
        hue: vis.hue != null ? vis.hue : (ARCHETYPE_HUE[archetype] || 180),
        pulse: vis.pulse != null ? vis.pulse : 1,
        neighbors: (s.neighbors || []).map(function (slot) { return idBySlot.get(slot); }).filter(Boolean),
        growth: s.growth == null ? 1 : s.growth, slot: s.slot,
      };
    });
  }

  const DEMO_SNAPSHOT = {
    time: 0,
    env: { light: 0.62, current: 0.35, disturbance: 0.05 },
    nodes: [
      { id: "n0", defId: "absorber", archetype: "core", hue: 185, pulse: 1.2, neighbors: ["n1", "n2", "n3", "n7"] },
      { id: "n1", defId: "tentacle", archetype: "tentacle", hue: 168, pulse: 1.4, neighbors: ["n0", "n8"] },
      { id: "n2", defId: "chamber", archetype: "chamber", hue: 210, pulse: 0.9, neighbors: ["n0", "n3", "n9"] },
      { id: "n3", defId: "symbiont", archetype: "symbiont", hue: 95, pulse: 1.6, neighbors: ["n0", "n2", "n4"] },
      { id: "n4", defId: "membrane", archetype: "membrane", hue: 195, pulse: 0.7, neighbors: ["n3", "n5"] },
      { id: "n5", defId: "bud", archetype: "bud", hue: 145, pulse: 1.1, neighbors: ["n4"], growth: 0.85 },
      { id: "n6", defId: "sensor", archetype: "sensor", hue: 280, pulse: 1.3, neighbors: ["n7", "n8"] },
      { id: "n7", defId: "vessel", archetype: "vessel", hue: 200, pulse: 0.8, neighbors: ["n0", "n6", "n9"] },
      { id: "n8", defId: "venom", archetype: "venom", hue: 330, pulse: 1.5, neighbors: ["n1", "n6"] },
      { id: "n9", defId: "bacteria", archetype: "bacteria", hue: 55, pulse: 1.0, neighbors: ["n2", "n7"] },
    ],
    edges: [
      { from: "n0", to: "n1", flow: 0.8 }, { from: "n0", to: "n2", flow: 0.7 },
      { from: "n0", to: "n3", flow: 0.6 }, { from: "n0", to: "n7", flow: 0.9 },
      { from: "n2", to: "n3", flow: 0.5 }, { from: "n3", to: "n4", flow: 0.4 },
      { from: "n4", to: "n5", flow: 0.35 }, { from: "n7", to: "n6", flow: 0.55 },
      { from: "n6", to: "n8", flow: 0.65 }, { from: "n1", to: "n8", flow: 0.5 },
      { from: "n2", to: "n9", flow: 0.75 }, { from: "n7", to: "n9", flow: 0.7 },
    ],
  };

  global.PolypsViz = {
    ColonyRenderer: ColonyRenderer,
    vizNodesFromSim: vizNodesFromSim,
    DEMO_SNAPSHOT: DEMO_SNAPSHOT,
    ARCHETYPE_HUE: ARCHETYPE_HUE,
    layoutColony: layoutColony,
    hitTest: hitTest,
  };
})(typeof window !== "undefined" ? window : globalThis);
