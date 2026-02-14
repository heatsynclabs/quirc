import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ── Palette ── */
const P = {
  teal: "#08D9D6", orange: "#e85d3b", gold: "#f0c040",
  pink: "#FF2E63", acid: "#EAFF00",
  bg: "#0a0a0a", card: "#0f0f0f", raised: "#141414", hover: "#111",
  b1: "#1a1a1a", b2: "#2a2a2a",
  t1: "#ccc", t2: "#999", t3: "#555", t4: "#333",
};

/* ── Pixel Bitmaps ── */
const BM = {
  Q: [
    "XXXXXXXX", "XXXXXXXX", "XX....XX", "XX....XX",
    "XX..XXXX", "XX...XXX", "XXXXXXXX", ".XXXXXXX",
    "....XXXX", ".....XXX",
  ],
  U: [
    "XX....XX", "XX....XX", "XX....XX", "XX....XX",
    "XX....XX", "XX....XX", "XXXXXXXX", "XXXXXXXX",
  ],
  I: [
    "XXXXXX", "XXXXXX", "..XX..", "..XX..",
    "..XX..", "..XX..", "XXXXXX", "XXXXXX",
  ],
  R: [
    "XXXXXX..", "XXXXXXX.", "XX...XXX", "XX..XXX.",
    "XXXXXX..", "XX.XX...", "XX..XX..", "XX...XX.",
  ],
  C: [
    ".XXXXXXX", "XXXXXXXX", "XXX.....", "XX......",
    "XX......", "XXX.....", "XXXXXXXX", ".XXXXXXX",
  ],
};

function extractPixels(bitmap, ox, oy, cell) {
  const pixels = [];
  bitmap.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "X") pixels.push({ x: ox + x * cell, y: oy + y * cell });
    });
  });
  return pixels;
}

function buildLogoPixels(px, gap) {
  const cell = px + gap;
  const lspc = cell;
  const rspc = cell;

  const quPixels = [];
  const ircPixels = [];

  // QU row
  quPixels.push(...extractPixels(BM.Q, 0, 0, cell));
  const qW = BM.Q[0].length * cell;
  quPixels.push(...extractPixels(BM.U, qW + lspc, 0, cell));

  // IRC row
  const row2Y = BM.Q.length * cell + rspc;
  let cx = 0;
  for (const letter of ["I", "R", "C"]) {
    ircPixels.push(...extractPixels(BM[letter], cx, row2Y, cell));
    cx += BM[letter][0].length * cell + lspc;
  }

  const ircEndX = cx - lspc;
  const uW = BM.U[0].length * cell;
  const row1W = qW + lspc + uW;
  const iconW = Math.max(row1W, ircEndX);
  const ircH = BM.I.length * cell;
  const iconH = row2Y + ircH;

  // cursor block
  const cursorGap = cell * 0.5;
  const cursorX = ircEndX + cursorGap;
  const cursorW = px * 2.5;
  const cursorH = ircH;

  return { quPixels, ircPixels, cursorX, cursorY: row2Y, cursorW, cursorH, iconW, iconH, px };
}

/* ── Static Logo Mark ── */
function QuircMark({ size = 28 }) {
  const px = 2.2;
  const gap = 0.5;
  const data = useMemo(() => buildLogoPixels(px, gap), []);
  const totalW = data.cursorX + data.cursorW;
  const totalH = data.iconH;
  const scale = size / Math.max(totalW, totalH);

  return (
    <svg width={totalW * scale} height={totalH * scale} viewBox={`0 0 ${totalW} ${totalH}`}>
      {data.quPixels.map((p, i) => (
        <rect key={`q${i}`} x={p.x} y={p.y} width={px} height={px} fill={P.pink} />
      ))}
      {data.ircPixels.map((p, i) => (
        <rect key={`i${i}`} x={p.x} y={p.y} width={px} height={px} fill={P.teal} />
      ))}
      <rect x={data.cursorX} y={data.cursorY} width={data.cursorW} height={data.cursorH} fill={P.acid} />
    </svg>
  );
}

/* ── Animated Splash Logo ── */
function SplashLogo({ onAnimDone }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const px = 7;
    const gap = 1.5;
    const data = buildLogoPixels(px, gap);
    const totalW = data.cursorX + data.cursorW + 20;
    const totalH = data.iconH + 10;

    canvas.width = totalW * dpr;
    canvas.height = totalH * dpr;
    canvas.style.width = `${totalW}px`;
    canvas.style.height = `${totalH}px`;
    ctx.scale(dpr, dpr);

    // Assign each pixel a random delay for cascade effect
    const allQU = data.quPixels.map((p, i) => ({
      ...p, color: P.pink,
      delay: 200 + (p.y / totalH) * 400 + Math.random() * 300,
      phase: "pending",
    }));
    const allIRC = data.ircPixels.map((p, i) => ({
      ...p, color: P.teal,
      delay: 600 + (p.y / totalH) * 400 + Math.random() * 300,
      phase: "pending",
    }));

    const allPixels = [...allQU, ...allIRC];
    const cursorDelay = 1400;
    const flashDuration = 80;
    let cursorState = "pending"; // pending -> flash -> on
    let cursorFlashStart = 0;

    const startTime = performance.now();
    let rafId;

    function draw(now) {
      const t = now - startTime;
      ctx.clearRect(0, 0, totalW, totalH);

      // Draw pixels with scanline-rain arrival
      for (const px2 of allPixels) {
        if (t < px2.delay) continue;
        const age = t - px2.delay;

        if (age < 60) {
          // Flash white then settle
          const flash = 1 - age / 60;
          ctx.fillStyle = `rgba(255,255,255,${flash * 0.8})`;
          ctx.fillRect(px2.x, px2.y, px, px);
          ctx.fillStyle = px2.color;
          ctx.globalAlpha = age / 60;
          ctx.fillRect(px2.x, px2.y, px, px);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = px2.color;
          ctx.fillRect(px2.x, px2.y, px, px);
        }
      }

      // Scanline effect during pixel rain
      if (t > 200 && t < 1600) {
        const scanY = ((t - 200) / 1400) * totalH;
        const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 4);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.06)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 20, totalW, 24);
      }

      // Cursor block
      if (t >= cursorDelay) {
        if (cursorState === "pending") {
          cursorState = "flash";
          cursorFlashStart = t;
        }
        if (cursorState === "flash") {
          const flashAge = t - cursorFlashStart;
          if (flashAge < flashDuration) {
            // Bright white flash
            ctx.fillStyle = "#fff";
            ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH);
          } else if (flashAge < flashDuration * 2) {
            // Settle to acid yellow
            const settle = (flashAge - flashDuration) / flashDuration;
            ctx.fillStyle = P.acid;
            ctx.globalAlpha = settle;
            ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH);
            ctx.globalAlpha = 1;
            ctx.fillStyle = `rgba(255,255,255,${1 - settle})`;
            ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH);
          } else {
            cursorState = "on";
          }
        }
        if (cursorState === "on") {
          // Blink cursor
          const blinkT = (t - cursorFlashStart - flashDuration * 2) % 1000;
          if (blinkT < 600) {
            ctx.fillStyle = P.acid;
            ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH);
          }
        }
      }

      // CRT glow lines
      for (let y = 0; y < totalH; y += 3) {
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, y, totalW, 1);
      }

      if (t < 4000) {
        rafId = requestAnimationFrame(draw);
      } else {
        // Final static frame
        ctx.clearRect(0, 0, totalW, totalH);
        for (const px2 of allPixels) {
          ctx.fillStyle = px2.color;
          ctx.fillRect(px2.x, px2.y, px, px);
        }
        ctx.fillStyle = P.acid;
        ctx.fillRect(data.cursorX, data.cursorY, data.cursorW, data.cursorH);
        for (let y = 0; y < totalH; y += 3) {
          ctx.fillStyle = "rgba(0,0,0,0.08)";
          ctx.fillRect(0, y, totalW, 1);
        }
        if (!doneRef.current) {
          doneRef.current = true;
          onAnimDone?.();
        }
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [onAnimDone]);

  return <canvas ref={canvasRef} style={{ imageRendering: "pixelated" }} />;
}

/* ── Splash Screen ── */
function Splash({ onDone }) {
  const [phase, setPhase] = useState("logo"); // logo -> text -> out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 1800);
    const t2 = setTimeout(() => setPhase("out"), 3400);
    const t3 = setTimeout(onDone, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      height: "100vh", background: P.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 20, fontFamily: "monospace",
      opacity: phase === "out" ? 0 : 1,
      transition: "opacity .5s ease",
    }}>
      <style>{`
        @keyframes qGlitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, -2px); }
          80% { transform: translate(1px, 2px); }
        }
        @keyframes qFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes qBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes qScanDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(100vh); }
        }
      `}</style>

      {/* Scanline sweep */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${P.acid}44, transparent)`,
        animation: "qScanDown 2s ease-in-out",
        opacity: phase === "logo" ? 0.6 : 0,
        pointerEvents: "none",
      }} />

      {/* Logo canvas */}
      <div style={{
        animation: phase === "text" ? "none" : "qGlitch .1s ease 1.5s 3",
      }}>
        <SplashLogo />
      </div>

      {/* Wordmark */}
      <div style={{
        opacity: phase === "text" || phase === "out" ? 1 : 0,
        transform: phase === "text" || phase === "out" ? "translateY(0)" : "translateY(12px)",
        transition: "all .4s ease",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 48, fontWeight: 800, color: "#fff",
          letterSpacing: 8, lineHeight: 1,
        }}>
          {"QUIRC".split("").map((ch, i) => (
            <span key={i} style={{
              display: "inline-block",
              animation: phase === "text" ? `qFadeUp .3s ease ${i * 0.06}s both` : "none",
              color: i < 2 ? P.pink : (i === 4 ? P.teal : "#fff"),
            }}>{ch}</span>
          ))}
        </div>
        <div style={{
          fontSize: 10, letterSpacing: 6, color: P.t4,
          marginTop: 8,
          animation: phase === "text" ? "qFadeUp .3s ease .4s both" : "none",
        }}>
          QUICK IRC
        </div>
      </div>

      {/* Connection status */}
      <div style={{
        fontSize: 11, color: P.t4, fontFamily: "monospace",
        opacity: phase === "text" || phase === "out" ? 1 : 0,
        transition: "opacity .3s ease .6s",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: P.teal,
          animation: "qBlink 1s ease infinite",
        }} />
        connecting to irc.quirc.chat...
      </div>
    </div>
  );
}

/* ── Data ── */
const CHS = [
  { name: "#general", unread: 3, topic: "anything goes" },
  { name: "#projects", unread: 0, topic: "show what you're building" },
  { name: "#events", unread: 1, topic: "meetups & workshops" },
  { name: "#help", unread: 0, topic: "no dumb questions" },
  { name: "#random", unread: 7, topic: "off-topic chaos" },
];
const USERS = [
  { nick: "moheeb", s: "on", op: true }, { nick: "solderblob", s: "on" },
  { nick: "capacitor_kid", s: "on" }, { nick: "nullbyte", s: "away", op: true },
  { nick: "etch_a_sketch", s: "on" }, { nick: "diyOrDie", s: "away" },
  { nick: "breadboard_queen", s: "on" }, { nick: "flux_core", s: "off" },
];
const initMsgs = [
  { id: 1, nick: "solderblob", t: "21:03", text: "anyone got a spare FTDI adapter? mine just released the magic smoke", reactions: [{ e: "💀", u: 2 }] },
  { id: 2, nick: "capacitor_kid", t: "21:04", text: "F" },
  { id: 3, nick: "moheeb", t: "21:05", text: "check the parts bin by the laser cutter, pretty sure there's like 4 in there", reactions: [{ e: "👍", u: 1 }] },
  { id: 4, nick: "etch_a_sketch", t: "21:06", text: "just pushed the new door access code → https://github.com/quirc-chat/door-access", lp: { title: "quirc-chat/door-access", desc: "ESP32-based RFID door access", domain: "github.com" } },
  { id: 5, type: "sys", t: "21:06", text: "breadboard_queen has joined #general" },
  { id: 6, nick: "breadboard_queen", t: "21:07", text: "yo is the space open rn?" },
  { id: 7, nick: "nullbyte", t: "21:07", text: "yep, handful of us here. pizza arriving in 20", reactions: [{ e: "🍕", u: 3 }] },
  { id: 8, nick: "diyOrDie", t: "21:09", text: "OMW 🛹" },
  { id: 9, nick: "solderblob", t: "21:10", text: "found it! it was under a pile of resistor tapes lol", reactions: [{ e: "🎉", u: 1 }] },
  { id: 10, nick: "etch_a_sketch", t: "21:11", text: "here's the pinout:\n```\nGPIO 2  → LED\nGPIO 4  → RFID SDA\nGPIO 5  → RFID SCK\nGPIO 18 → RELAY\nGPIO 19 → BUZZER\n```" },
  { id: 11, nick: "moheeb", t: "21:12", text: "reminder: lightning talks this thursday. sign up on the wiki or just show up and wing it" },
  { id: 12, nick: "breadboard_queen", t: "21:13", text: "check out the badge PCB render 👀", reactions: [{ e: "🔥", u: 3 }], img: true },
  { id: 13, nick: "capacitor_kid", t: "21:14", text: "nice, does GPIO 18 need a flyback diode for the relay?", re: { nick: "etch_a_sketch", text: "here's the pinout..." } },
  { id: 14, nick: "etch_a_sketch", t: "21:15", text: "yeah there's one on the board already, `D1` on the schematic. used a `1N4007`", reactions: [{ e: "👍", u: 1 }] },
];

const NCOLORS = ["#e85d3b", "#f0c040", "#6bcb77", "#4d96ff", "#ff922b", "#cc5de8", "#20c997", "#ff6b9d", "#a9e34b", "#748ffc"];
function nc(n) { let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h); return NCOLORS[Math.abs(h) % NCOLORS.length]; }

/* ── Rich text ── */
function Rich({ text }) {
  const parts = []; const re = /```([\s\S]*?)```/g; let last = 0, m;
  while ((m = re.exec(text)) !== null) { if (m.index > last) parts.push({ k: "t", v: text.slice(last, m.index) }); parts.push({ k: "c", v: m[1].trim() }); last = m.index + m[0].length; }
  if (last < text.length) parts.push({ k: "t", v: text.slice(last) });
  return <>{parts.map((p, i) => p.k === "c"
    ? <div key={i} style={{ background: "#080808", border: `1px solid ${P.b1}`, borderLeft: `3px solid ${P.b2}`, padding: "10px 12px", margin: "6px 0", fontSize: 12, fontFamily: "monospace", color: "#6bcb77", whiteSpace: "pre", overflowX: "auto", lineHeight: 1.6 }}>{p.v}</div>
    : <span key={i}>{p.v.split(/(`[^`]+`)/g).map((s, j) => s.startsWith("`") && s.endsWith("`")
      ? <code key={j} style={{ background: "#111", padding: "1px 5px", border: `1px solid ${P.b1}`, fontSize: 12, color: P.orange }}>{s.slice(1, -1)}</code>
      : <span key={j}>{s}</span>)}</span>)}</>;
}

/* ── Noise ── */
function Noise() { return <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />; }

/* ── Drawers ── */
function ChDrawer({ open, onClose, chs, active, onPick }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", opacity: open ? 1 : 0, transition: "opacity .2s" }} />
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 280, background: P.card, borderRight: `2px solid ${P.b2}`, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform .25s ease", display: "flex", flexDirection: "column", fontFamily: "monospace" }}>
        <div style={{ padding: "16px", borderBottom: `2px solid ${P.b2}`, display: "flex", alignItems: "center", gap: 10 }}>
          <QuircMark size={34} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 3 }}>QUIRC</div>
            <div style={{ fontSize: 10, color: P.t3 }}>irc.quirc.chat:6697</div>
          </div>
        </div>
        <div style={{ padding: "12px 0", flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "0 16px 8px", fontSize: 10, letterSpacing: 3, color: P.t4, textTransform: "uppercase" }}>channels</div>
          {chs.map(c => (
            <div key={c.name} onClick={() => { onPick(c.name); onClose(); }} style={{ padding: "10px 16px", cursor: "pointer", background: c.name === active ? P.hover : "transparent", borderLeft: c.name === active ? `3px solid ${P.orange}` : "3px solid transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: c.name === active ? "#fff" : P.t2, fontSize: 14 }}>{c.name}</span>
              {c.unread > 0 && <span style={{ background: P.orange, color: "#000", fontSize: 10, fontWeight: 700, padding: "2px 6px" }}>{c.unread}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", borderTop: `2px solid ${P.b2}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6bcb77", boxShadow: "0 0 6px #6bcb77" }} />
          <span style={{ color: "#aaa", fontSize: 13 }}>moheeb</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: P.t3, border: `1px solid ${P.b2}`, padding: "2px 6px" }}>@op</span>
        </div>
      </div>
    </div>
  );
}

function UserDrawer({ open, onClose }) {
  const sorted = [...USERS].sort((a, b) => ({ on: 0, away: 1, off: 2 }[a.s] - { on: 0, away: 1, off: 2 }[b.s]));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", opacity: open ? 1 : 0, transition: "opacity .2s" }} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 240, background: P.card, borderLeft: `2px solid ${P.b2}`, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform .25s ease", fontFamily: "monospace" }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: `2px solid ${P.b2}` }}>
          <div style={{ fontSize: 11, color: P.t4, letterSpacing: 3, textTransform: "uppercase" }}>who's here</div>
          <div style={{ fontSize: 13, color: P.t2, marginTop: 4 }}>{USERS.filter(u => u.s !== "off").length} online</div>
        </div>
        <div style={{ padding: "8px 0" }}>
          {sorted.map(u => (
            <div key={u.nick} style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, opacity: u.s === "off" ? .35 : u.s === "away" ? .6 : 1 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: u.s === "on" ? "#6bcb77" : u.s === "away" ? P.gold : "#444" }} />
              <span style={{ color: nc(u.nick), fontSize: 13 }}>{u.op ? "@" : ""}{u.nick}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Search({ open, onClose, msgs }) {
  const [q, setQ] = useState(""); const ref = useRef(null);
  useEffect(() => { if (open) { setQ(""); setTimeout(() => ref.current?.focus(), 100); } }, [open]);
  const res = q.length > 1 ? msgs.filter(m => !m.type && m.text.toLowerCase().includes(q.toLowerCase())) : [];
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.92)", display: "flex", flexDirection: "column", fontFamily: "monospace" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderBottom: `2px solid ${P.b2}` }}>
        <span style={{ color: P.orange, fontSize: 16 }}>⌕</span>
        <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="search messages..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: P.t1, fontSize: 14, fontFamily: "monospace" }} />
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${P.b2}`, color: P.t2, padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>ESC</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {q.length > 1 && !res.length && <div style={{ padding: 20, color: P.t4, fontSize: 12, textAlign: "center" }}>no results</div>}
        {res.map(m => (
          <div key={m.id} style={{ padding: "8px 16px", borderBottom: `1px solid ${P.b1}` }}>
            <span style={{ color: P.t4, fontSize: 10 }}>{m.t} </span>
            <span style={{ color: nc(m.nick), fontSize: 12, fontWeight: 700 }}>{m.nick}</span>
            <div style={{ color: P.t2, fontSize: 12, marginTop: 2 }}>{m.text.slice(0, 120)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Message ── */
const EMOJIS = ["👍", "👎", "🔥", "💀", "🎉", "🍕", "❤️", "😂", "🤔", "⚡"];

function Msg({ m, onReact, onReply }) {
  const [hover, setHover] = useState(false);
  const [ep, setEp] = useState(false);
  const timer = useRef(null);

  if (m.type === "sys") return <div style={{ padding: "3px 16px", fontSize: 11, color: P.t4, fontFamily: "monospace", fontStyle: "italic" }}><span style={{ color: P.t3 }}>{m.t}</span> {m.text}</div>;

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setEp(false); }}
      onTouchStart={() => { timer.current = setTimeout(() => setHover(true), 400); }}
      onTouchEnd={() => clearTimeout(timer.current)}
      style={{ padding: "6px 16px", fontFamily: "monospace", fontSize: 13, lineHeight: 1.5, position: "relative", background: hover ? P.hover : "transparent" }}
    >
      {m.re && <div style={{ borderLeft: `2px solid ${nc(m.re.nick)}`, padding: "2px 8px", marginBottom: 4, fontSize: 11, color: P.t3 }}><span style={{ color: nc(m.re.nick), fontWeight: 700 }}>{m.re.nick}</span> {m.re.text}</div>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: P.t4, fontSize: 10, flexShrink: 0 }}>{m.t}</span>
        <span style={{ color: nc(m.nick), fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{m.nick}</span>
      </div>
      <div style={{ color: P.t1, marginTop: 1 }}><Rich text={m.text} /></div>

      {m.lp && <div style={{ margin: "6px 0", padding: "8px 10px", borderLeft: `3px solid ${P.teal}`, background: P.raised, maxWidth: 340 }}>
        <div style={{ fontSize: 10, color: P.t3, marginBottom: 3 }}>{m.lp.domain}</div>
        <div style={{ fontSize: 12, color: "#ddd", fontWeight: 700, marginBottom: 2 }}>{m.lp.title}</div>
        <div style={{ fontSize: 11, color: P.t2 }}>{m.lp.desc}</div>
      </div>}

      {m.img && <div style={{ margin: "6px 0", width: 260, height: 140, background: "linear-gradient(135deg,#0a0a14,#101028,#0a1a30)", border: `1px solid ${P.b1}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 24 }}>🔧</div><div style={{ fontSize: 10, color: "#4d96ff", letterSpacing: 2 }}>PCB RENDER</div></div>
      </div>}

      {m.reactions && <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
        {m.reactions.map((r, i) => <button key={i} onClick={() => onReact(m.id, r.e)} style={{ background: P.raised, border: `1px solid ${P.b1}`, padding: "1px 6px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: P.t2, fontFamily: "monospace" }}><span>{r.e}</span><span style={{ fontSize: 10 }}>{r.u}</span></button>)}
      </div>}

      {hover && <div style={{ position: "absolute", top: 4, right: 12, display: "flex", gap: 2 }}>
        <button onClick={() => onReply(m)} style={{ background: P.raised, border: `1px solid ${P.b2}`, color: P.t2, padding: "2px 6px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>↩</button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setEp(!ep)} style={{ background: P.raised, border: `1px solid ${P.b2}`, color: P.t2, padding: "2px 6px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>+😀</button>
          {ep && <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 4, background: P.raised, border: `1px solid ${P.b2}`, padding: 8, display: "flex", gap: 2, flexWrap: "wrap", width: 200, zIndex: 50 }}>
            {EMOJIS.map(e => <button key={e} onClick={() => { onReact(m.id, e); setEp(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4 }}>{e}</button>)}
          </div>}
        </div>
      </div>}
    </div>
  );
}

/* ── Typing ── */
function Typing({ nicks }) {
  if (!nicks.length) return null;
  return <div style={{ padding: "4px 16px", fontSize: 11, color: P.t4, fontFamily: "monospace", fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ display: "inline-flex", gap: 2 }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: P.t3, animation: `qDot 1s ease ${i * .15}s infinite` }} />)}</span>
    {nicks.join(", ")} {nicks.length === 1 ? "is" : "are"} typing
  </div>;
}

/* ── App ── */
export default function QUIRC() {
  const [splash, setSplash] = useState(true);
  const [chDr, setChDr] = useState(false);
  const [usDr, setUsDr] = useState(false);
  const [search, setSearch] = useState(false);
  const [active, setActive] = useState("#general");
  const [msgs, setMsgs] = useState(initMsgs);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState(null);
  const [typing, setTyping] = useState([]);
  const endRef = useRef(null);
  const inRef = useRef(null);
  const ch = CHS.find(c => c.name === active);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { const a = setTimeout(() => setTyping(["solderblob"]), 6000); const b = setTimeout(() => setTyping([]), 9000); return () => { clearTimeout(a); clearTimeout(b); }; }, []);

  const send = () => {
    if (!input.trim()) return;
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setMsgs(p => [...p, { id: Date.now(), nick: "moheeb", t, text: input, re: reply ? { nick: reply.nick, text: reply.text.slice(0, 60) } : undefined }]);
    setInput(""); setReply(null); inRef.current?.focus();
  };

  const react = useCallback((id, e) => {
    setMsgs(p => p.map(m => {
      if (m.id !== id) return m;
      const rs = m.reactions || [];
      const ex = rs.find(r => r.e === e);
      if (ex) return { ...m, reactions: rs.map(r => r.e === e ? { ...r, u: r.u + 1 } : r) };
      return { ...m, reactions: [...rs, { e, u: 1 }] };
    }));
  }, []);

  if (splash) return <Splash onDone={() => setSplash(false)} />;

  return (
    <div style={{ height: "100vh", width: "100%", background: P.bg, display: "flex", flexDirection: "column", fontFamily: "monospace", color: P.t1, position: "relative", overflow: "hidden" }}>
      <Noise />
      <style>{`@keyframes qDot{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 12px", height: 52, flexShrink: 0, borderBottom: `2px solid ${P.b1}`, background: P.card }}>
        <button onClick={() => setChDr(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ width: 18, height: 2, background: P.orange }} /><div style={{ width: 14, height: 2, background: P.orange }} /><div style={{ width: 18, height: 2, background: P.orange }} />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <QuircMark size={28} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{active}</div>
            <div style={{ fontSize: 10, color: P.t3, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch?.topic}</div>
          </div>
        </div>
        <button onClick={() => setSearch(true)} style={{ background: "none", border: "none", color: P.t3, padding: 8, cursor: "pointer", fontSize: 14 }}>⌕</button>
        <button onClick={() => setUsDr(true)} style={{ background: "none", border: `1px solid ${P.b2}`, cursor: "pointer", padding: "4px 8px", fontSize: 10, color: P.t2, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6bcb77" }} />{USERS.filter(u => u.s !== "off").length}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
        {/* MOTD */}
        <div style={{ margin: "8px 16px 16px", padding: 12, border: `1px dashed ${P.b2}`, background: P.card }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: P.orange, textTransform: "uppercase", marginBottom: 6 }}>MOTD</div>
          <div style={{ fontSize: 12, color: P.t2, lineHeight: 1.5 }}>Welcome to <span style={{ color: P.gold }}>QUIRC</span> IRC. Be excellent to each other.</div>
        </div>
        {/* Unread divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 16px", margin: "4px 0" }}>
          <div style={{ flex: 1, height: 1, background: `${P.orange}33` }} />
          <span style={{ fontSize: 9, color: P.orange, letterSpacing: 2, textTransform: "uppercase" }}>new messages</span>
          <div style={{ flex: 1, height: 1, background: `${P.orange}33` }} />
        </div>
        {msgs.map(m => <Msg key={m.id} m={m} onReact={react} onReply={m => { setReply(m); inRef.current?.focus(); }} />)}
        <Typing nicks={typing} />
        <div ref={endRef} />
      </div>

      {/* Reply bar */}
      {reply && <div style={{ padding: "6px 12px", borderTop: `1px solid ${P.b1}`, background: P.card, display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace" }}>
        <span style={{ color: P.t3, fontSize: 11 }}>↩</span>
        <span style={{ color: nc(reply.nick), fontSize: 11, fontWeight: 700 }}>{reply.nick}</span>
        <span style={{ color: P.t4, fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reply.text.slice(0, 40)}</span>
        <button onClick={() => setReply(null)} style={{ background: "none", border: "none", color: P.t3, cursor: "pointer", fontSize: 14 }}>✕</button>
      </div>}

      {/* Input */}
      <div style={{ borderTop: `2px solid ${P.b1}`, padding: "8px 12px", paddingBottom: "max(8px, env(safe-area-inset-bottom))", background: P.card, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: P.orange, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>&gt;</span>
        <input ref={inRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="say something..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: P.t1, fontSize: 14, fontFamily: "monospace", padding: "8px 0" }} />
        <button onClick={send} style={{ background: input.trim() ? P.orange : P.b1, border: "none", color: input.trim() ? "#000" : P.t3, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", transition: "all .15s" }}>send</button>
      </div>

      <ChDrawer open={chDr} onClose={() => setChDr(false)} chs={CHS} active={active} onPick={setActive} />
      <UserDrawer open={usDr} onClose={() => setUsDr(false)} />
      <Search open={search} onClose={() => setSearch(false)} msgs={msgs} />
    </div>
  );
}
