/**
 * Generates a deterministic Bauhaus-style SVG banner for events without an uploaded banner.
 * Uses the event title and id to seed the design so the same event always gets the same banner.
 */

const PALETTES = [
  { bg: '#121212', shapes: ['#D02020', '#F0C020', '#1040C0', '#FFFFFF'] },
  { bg: '#1040C0', shapes: ['#D02020', '#F0C020', '#FFFFFF', '#121212'] },
  { bg: '#D02020', shapes: ['#F0C020', '#1040C0', '#FFFFFF', '#121212'] },
  { bg: '#0D3399', shapes: ['#D02020', '#F0C020', '#FFFFFF', '#E11D48'] },
  { bg: '#1F2937', shapes: ['#D02020', '#F0C020', '#1040C0', '#16A34A'] },
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seeded(h, i) {
  return Math.abs(((h * 2654435761) ^ (i * 40503)) | 0);
}

export function generateBauhausBanner(title = 'Event', id = 0) {
  const seed = hash(title + String(id));
  const palette = PALETTES[seed % PALETTES.length];

  let shapes = '';
  const count = 3 + (seed % 3); // 3-5 shapes

  for (let i = 0; i < count; i++) {
    const s = seeded(seed, i + 1);
    const color = palette.shapes[s % palette.shapes.length];
    const opacity = 0.12 + (((s >> 4) % 15) / 100);
    const type = s % 3;

    const cx = (seeded(s, 3) % 700) + 50;
    const cy = (seeded(s, 5) % 200) + 50;
    const r = 30 + (seeded(s, 7) % 100);

    if (type === 0) {
      shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
    } else if (type === 1) {
      const w = r * 1.8;
      const h = r * 1.1;
      shapes += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}"/>`;
    } else {
      shapes += `<polygon points="${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}" fill="${color}" opacity="${opacity}"/>`;
    }
  }

  // Accent bar at top (Bauhaus tri-color)
  shapes += `<rect x="0" y="0" width="267" height="4" fill="#D02020"/>`;
  shapes += `<rect x="267" y="0" width="267" height="4" fill="#F0C020"/>`;
  shapes += `<rect x="534" y="0" width="266" height="4" fill="#1040C0"/>`;

  // Escape title for SVG
  const safe = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .toUpperCase();

  // Truncate long titles
  const display = safe.length > 40 ? safe.slice(0, 37) + '...' : safe;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
<rect width="800" height="300" fill="${palette.bg}"/>
${shapes}
<text x="400" y="155" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Outfit,Arial,Helvetica,sans-serif" font-weight="900" font-size="26" letter-spacing="3" opacity="0.92">${display}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
