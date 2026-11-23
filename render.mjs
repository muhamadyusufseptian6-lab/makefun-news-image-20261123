// render.mjs — draws entry.png (1024x1024) for news-image-20261123.
// Pure Node 22 stdlib: raw RGB buffer + node:zlib + a hand-written 5x7 bitmap font.
// No network, no npm, no external fonts. Deterministic output.
// Run: node render.mjs  (writes entry.png next to this file)

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- font: 5x7
// Each glyph: 7 rows of 5 cells ('#' = on). Advance = 6 units.
const FONT = {
  'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  'G': ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'I': ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  'a': ['.....', '.....', '.####', '....#', '.####', '#...#', '.###.'],
  'b': ['#....', '#....', '####.', '#...#', '#...#', '#...#', '####.'],
  'c': ['.....', '.....', '.####', '#....', '#....', '#....', '.####'],
  'd': ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.###.'],
  'e': ['.....', '.....', '.###.', '#...#', '#####', '#....', '.###.'],
  'f': ['..##.', '.#...', '.#...', '####.', '.#...', '.#...', '.#...'],
  'g': ['.....', '.###.', '#...#', '#...#', '.####', '....#', '.###.'],
  'h': ['#....', '#....', '####.', '#...#', '#...#', '#...#', '#...#'],
  'i': ['.....', '..#..', '.....', '.##..', '..#..', '..#..', '.###.'],
  'j': ['.....', '...#.', '.....', '..##.', '...#.', '...#.', '##...'],
  'k': ['#....', '#....', '#..#.', '#.#..', '##...', '#.#..', '#..#.'],
  'l': ['.##..', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  'm': ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  'n': ['.....', '.....', '####.', '#...#', '#...#', '#...#', '#...#'],
  'o': ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  'p': ['.....', '.....', '####.', '#...#', '####.', '#....', '#....'],
  'q': ['.....', '.....', '.####', '#...#', '.####', '....#', '....#'],
  'r': ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'],
  's': ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
  't': ['.#...', '.#...', '####.', '.#...', '.#...', '.#...', '..##.'],
  'u': ['.....', '.....', '#...#', '#...#', '#...#', '#..##', '.##.#'],
  'v': ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  'w': ['.....', '.....', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  'x': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  'y': ['.....', '.....', '#...#', '#...#', '.####', '....#', '.###.'],
  'z': ['.....', '.....', '#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
  ';': ['.....', '.##..', '.....', '.##..', '..#..', '.#...', '.....'],
  ':': ['.....', '.##..', '.....', '.##..', '.....', '.##..', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  '"': ['.#.#.', '.#.#.', '.....', '.....', '.....', '.....', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '/': ['....#', '....#', '...#.', '...#.', '..#..', '.#...', '#....'],
  '%': ['#...#', '#..#.', '...#.', '..#..', '.#...', '#..#.', '#...#'],
  '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '&': ['.###.', '#...#', '#...#', '.#...', '#.#.#', '#..#.', '.##.#'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '*': ['.....', '.#.#.', '..#..', '#####', '..#..', '.#.#.', '.....'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
  '|': ['..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  '•': ['.....', '.....', '.##..', '.##..', '.##..', '.....', '.....'],
  '—': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '’': ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  '“': ['.#.#.', '.#.#.', '.#.#.', '.....', '.....', '.....', '.....'],
  '”': ['.#.#.', '.#.#.', '.#.#.', '.....', '.....', '.....', '.....'],
};

// ---------------------------------------------------------------- canvas
const W = 1024, H = 1024;
const buf = Buffer.alloc(W * H * 3);
const NAVY = [26, 42, 74], NAVY2 = [32, 54, 96];
const PAPER = [247, 243, 234], CARD = [255, 255, 255];
const INK = [24, 28, 36], RED = [178, 34, 34], GOLD = [201, 162, 39];
const GREY = [90, 96, 108], LIGHT = [232, 228, 218], BLUE = [42, 92, 140];
const GREEN = [46, 125, 87], ORANGE = [214, 106, 24];

function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x, y, w, c) { rect(x, y, w, 1, c); }
function vline(x, y, h, c) { rect(x, y, 1, h, c); }
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) { px(x, y, c); if (x === x1 && y === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } }
}
function circle(cx, cy, r, c, fill) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = x * x + y * y;
    if (fill ? d <= r * r : d <= r * r && d >= (r - 2) * (r - 2)) px(cx + x, cy + y, c);
  }
}
function disc(cx, cy, r, c) { circle(cx, cy, r, c, true); }

// ---------------------------------------------------------------- text
function textWidth(s, scale) { return s.length * 6 * scale - scale; }
function drawChar(ch, x, y, scale, c) {
  const g = FONT[ch] || FONT['?'];
  for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
    if (g[r][col] === '#') rect(x + col * scale, y + r * scale, scale, scale, c);
  }
}
function drawText(s, x, y, scale, c) {
  let cx = x;
  for (const ch of s) { drawChar(ch, cx, y, scale, c); cx += 6 * scale; }
  return cx;
}
function drawTextCentered(s, cx, y, scale, c) { drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c); }
// Greedy word wrap; returns lines that fit maxWidth px.
function wrap(s, maxWidth, scale) {
  const words = s.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t, scale) <= maxWidth) { cur = t; continue; }
    if (cur) lines.push(cur);
    cur = w;
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(s, x, y, maxWidth, scale, c, lineH) {
  const lines = wrap(s, maxWidth, scale);
  lines.forEach((ln, i) => drawText(ln, x, y + i * lineH, scale, c));
  return lines.length;
}

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(b) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(new URL('./entry.png', import.meta.url), png);
  return png.length;
}

// ---------------------------------------------------------------- icons (56x56 box)
function iconGlobe(x, y, s) { // s = box size
  const cx = x + s / 2, cy = y + s / 2, r = s / 2 - 3;
  circle(cx, cy, r, BLUE, false);
  hline(cx - r + 4, cy, 2 * r - 8, BLUE);
  for (let k = 1; k <= 2; k++) {
    const dy = Math.round(r * k / 3);
    const wdt = Math.round(Math.sqrt(r * r - dy * dy));
    hline(cx - wdt, cy - dy, 2 * wdt, BLUE);
    hline(cx - wdt, cy + dy, 2 * wdt, BLUE);
  }
  for (let k = -1; k <= 1; k++) {
    const rx = Math.round(r * 0.5);
    for (let yy = -r + 2; yy <= r - 2; yy++) {
      const xx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (r * r))));
      px(cx + k * xx, cy + yy, BLUE);
    }
  }
  vline(cx, cy - r + 2, 2 * r - 4, BLUE);
}
function iconCapitol(x, y, s) {
  const cx = x + s / 2, base = y + s - 6;
  // dome
  for (let a = 0; a <= 18; a++) {
    const t = (Math.PI * a) / 18;
    const dx = Math.round(Math.cos(t) * 16), dy = Math.round(Math.sin(t) * 14);
    px(cx + dx, base - 22 - dy, NAVY); px(cx - dx, base - 22 - dy, NAVY);
  }
  hline(cx - 16, base - 22, 33, NAVY);
  rect(cx - 2, base - 42, 4, 6, NAVY); // spire
  rect(cx - 20, base - 20, 40, 4, NAVY);
  for (let i = 0; i < 5; i++) rect(x + 6 + i * 9, base - 16, 4, 14, NAVY);
  rect(x + 4, base - 2, s - 8, 3, NAVY);
}
function iconShield(x, y, s) {
  const cx = x + s / 2, top = y + 4, bot = y + s - 4;
  line(cx - 20, top, cx + 20, top, NAVY);
  line(cx - 20, top, cx - 20, top + 22, NAVY);
  line(cx + 20, top, cx + 20, top + 22, NAVY);
  line(cx - 20, top + 22, cx, bot, NAVY);
  line(cx + 20, top + 22, cx, bot, NAVY);
  // star
  const sx = cx, sy = top + 16;
  line(sx, sy - 8, sx + 2, sy - 2, RED); line(sx, sy - 8, sx - 2, sy - 2, RED);
  line(sx - 8, sy - 1, sx + 8, sy - 1, RED);
  line(sx - 6, sy + 6, sx - 2, sy - 2, RED); line(sx + 6, sy + 6, sx + 2, sy - 2, RED);
  line(sx - 6, sy + 6, sx, sy + 1, RED); line(sx + 6, sy + 6, sx, sy + 1, RED);
}
function iconFlame(x, y, s) {
  const cx = x + s / 2, base = y + s - 6;
  // outer flame: stacked discs + peak
  disc(cx, base - 12, 13, ORANGE);
  disc(cx - 2, base - 24, 10, ORANGE);
  disc(cx + 2, base - 30, 7, ORANGE);
  for (let i = 0; i < 10; i++) px(cx + 2 - i, base - 32 - i * 2, ORANGE);
  disc(cx, base - 10, 6, [255, 196, 66]); // inner glow
  rect(x + 4, base, s - 8, 3, [120, 60, 20]);
}
function iconFlags(x, y, s) {
  // two small flags on poles
  vline(x + 8, y + 8, s - 14, INK);
  vline(x + s - 12, y + 8, s - 14, INK);
  rect(x + 9, y + 8, 18, 13, [255, 153, 51]); // saffron
  rect(x + 9, y + 21, 18, 13, [19, 136, 8]);  // green
  rect(x + s - 30, y + 8, 17, 13, [220, 20, 60]); // crimson
  rect(x + s - 30, y + 21, 17, 13, [0, 56, 147]);  // blue
  hline(x + 6, y + s - 6, s - 12, INK);
}
function iconBat(x, y, s) {
  // cricket bat + ball
  const cx = x + s / 2, cy = y + s / 2;
  line(cx - 14, cy + 18, cx + 10, cy - 16, [139, 90, 43]);
  line(cx - 10, cy + 20, cx + 14, cy - 14, [139, 90, 43]);
  line(cx + 10, cy - 16, cx + 16, cy - 24, [139, 90, 43]);
  line(cx + 14, cy - 14, cx + 20, cy - 22, [139, 90, 43]);
  disc(cx - 16, cy - 14, 7, RED);
}
function iconCap(x, y, s) {
  // graduation cap
  const cx = x + s / 2, cy = y + s / 2 - 4;
  line(cx - 22, cy, cx, cy - 10, INK);
  line(cx + 22, cy, cx, cy - 10, INK);
  line(cx - 22, cy, cx, cy + 10, INK);
  line(cx + 22, cy, cx, cy + 10, INK);
  rect(cx - 11, cy + 2, 22, 9, INK);
  vline(cx + 22, cy, 14, GOLD);
  disc(cx + 22, cy + 16, 3, GOLD);
}

// ---------------------------------------------------------------- layout
rect(0, 0, W, H, PAPER);

// Masthead
rect(24, 24, 976, 96, NAVY);
rect(24, 120, 976, 4, GOLD);
drawTextCentered('THE WORLD IN ONE PICTURE', 512, 44, 4, [255, 255, 255]);
drawTextCentered('MONDAY, 23 NOVEMBER 2026', 512, 88, 2, GOLD);

// Lead banner — COP31
const LB_Y = 136, LB_H = 168;
rect(24, LB_Y, 976, LB_H, CARD);
rect(24, LB_Y, 976, 2, RED);
rect(24, LB_Y, 8, LB_H, RED);
drawText('LEAD STORY  •  CLIMATE  •  ANTALYA, TURKEY', 52, LB_Y + 16, 2, RED);
drawText('COP31 COLLAPSES WITH NO DEAL', 52, LB_Y + 46, 4, INK);
drawPara('Two weeks of UN climate talks end with no pact after the EU rejects a draft that drops fossil fuels. The longest COP ever.',
  52, LB_Y + 92, 700, 2, [52, 58, 70], 19);
iconGlobe(856, LB_Y + 34, 110);

// Story cards: 2 cols x 3 rows
const cards = [
  { tag: 'UNITED STATES', icon: iconCapitol, color: NAVY,
    head: 'DEMOCRATS WIN 258 HOUSE SEATS',
    body: 'The biggest House majority since 1992, as a North Carolina win seals a midterm sweep.' },
  { tag: 'EUROPE  •  NATO', icon: iconShield, color: NAVY,
    head: 'NATO MEETS OVER POLAND MISSILES',
    body: 'Allies gather in Brussels after Russian missiles and a drone crossed into Poland.' },
  { tag: 'INDONESIA', icon: iconFlame, color: NAVY,
    head: 'JAVA FACTORY FIRE SEARCH RESUMES',
    body: 'Rescuers return to the burned candy plant in Banten; 24 body bags recovered so far.' },
  { tag: 'SOUTH ASIA', icon: iconFlags, color: NAVY,
    head: 'NEPAL PM MEETS MODI IN DELHI',
    body: "Balendra Shah's first state visit focuses on energy, trade and cross-border links." },
  { tag: 'SOUTH KOREA', icon: iconCap, color: NAVY,
    head: 'SEOUL MINISTER QUITS OVER AI EXAMS',
    body: 'Education chief Choi Kyo-jin resigns after AI-cheating chaos at the college entrance test.' },
  { tag: 'SPORT  •  CRICKET', icon: iconBat, color: NAVY,
    head: 'INDIA POST RECORD 720 IN TEST',
    body: 'India declare on 720 for 9 in Wellington — a record total — on day four against New Zealand.' },
];
const CW = 480, CH = 196, GX = 24, GY = 320, GAP = 16;
cards.forEach((c, i) => {
  const cx = GX + (i % 2) * (CW + GAP);
  const cy = GY + Math.floor(i / 2) * (CH + 14);
  rect(cx, cy, CW, CH, CARD);
  rect(cx, cy, CW, 2, GOLD);
  rect(cx, cy, 3, CH, LIGHT);
  c.icon(cx + 14, cy + 14, 56);
  drawText(c.tag, cx + 82, cy + 18, 2, RED);
  drawPara(c.head, cx + 82, cy + 42, CW - 96, 3, INK, 26);
  drawPara(c.body, cx + 16, cy + 118, CW - 32, 2, [52, 58, 70], 19);
});

// Footer
hline(24, 962, 976, GOLD);
drawTextCentered('Sources: BBC  •  Reuters  •  Associated Press  •  UN News  •  Yonhap  •  IANS',
  512, 976, 2, GREY);
drawTextCentered('All stories first reported on Monday, 23 November 2026.',
  512, 998, 1, GREY);

const bytes = encodePNG();
console.log('entry.png bytes:', bytes);
