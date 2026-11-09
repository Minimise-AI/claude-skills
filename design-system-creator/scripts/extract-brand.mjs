#!/usr/bin/env node
/**
 * extract-brand.mjs — zero-dependency brand extraction.
 *
 * Fallback for when Firecrawl and extract-design-system are not installed.
 * Needs nothing but Node 18+ (global fetch). No npm install, no API key,
 * no browser. Fetches a page, follows its stylesheets, and reports the
 * design tokens that actually appear in the published CSS, ranked by how
 * often they are used.
 *
 * Usage:
 *   node extract-brand.mjs https://example.com
 *   node extract-brand.mjs https://example.com --json > tokens.json
 *   node extract-brand.mjs https://example.com --pages /pricing,/about
 *
 * What it CANNOT do (say so rather than pretending):
 *   - It reads the CSS the server sends. It does not run JavaScript, so a
 *     site that paints its theme at runtime returns thin results.
 *   - It counts declarations, not rendered pixels. A colour declared once
 *     on the hero outranks nothing; frequency is a hint, not a verdict.
 *   - It takes no screenshot and reads no image.
 */

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
const asJson = args.includes('--json');
const pagesArg = args.find((a) => a.startsWith('--pages='));
const extraPages = pagesArg ? pagesArg.split('=')[1].split(',').filter(Boolean) : [];

if (!url) {
  console.error('usage: node extract-brand.mjs <url> [--json] [--pages=/pricing,/about]');
  process.exit(2);
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

async function get(u) {
  const res = await fetch(u, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${u}`);
  return await res.text();
}

function abs(href, base) {
  try { return new URL(href, base).href; } catch { return null; }
}

function bump(map, key, n = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + n);
}

function ranked(map, limit = 24) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

// ---------- colour normalisation ----------
function expandHex(h) {
  const s = h.replace('#', '');
  if (s.length === 3 || s.length === 4) return '#' + s.slice(0, 3).split('').map((c) => c + c).join('').toLowerCase();
  return '#' + s.slice(0, 6).toLowerCase();
}

const COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|color\(\s*display-p3[^)]*\))/g;

function normaliseColor(raw) {
  const t = raw.trim().toLowerCase();
  if (t.startsWith('#')) return expandHex(t);
  return t.replace(/\s+/g, ' ');
}

function isNeutral(hex) {
  if (!hex.startsWith('#') || hex.length !== 7) return false;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max - min <= 12;
}

// ---------- collectors ----------
const colors = new Map();
const fonts = new Map();
const radii = new Map();
const shadows = new Map();
const fontSizes = new Map();
const fontWeights = new Map();
const spacing = new Map();
const cssVars = new Map();
const letterSpacing = new Map();
const transitions = new Map();
const gradients = new Map();

function harvestCss(css) {
  // strip comments so commented-out tokens do not inflate counts
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  for (const m of css.matchAll(COLOR_RE)) bump(colors, normaliseColor(m[1]));

  for (const m of css.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) {
    bump(fonts, m[1].trim().replace(/\s+/g, ' ').replace(/["']/g, ''));
  }
  for (const m of css.matchAll(/border-radius\s*:\s*([^;{}]+)/gi)) {
    bump(radii, m[1].trim().replace(/\s+/g, ' '));
  }
  for (const m of css.matchAll(/box-shadow\s*:\s*([^;{}]+)/gi)) {
    const v = m[1].trim().replace(/\s+/g, ' ');
    if (v !== 'none') bump(shadows, v);
  }
  for (const m of css.matchAll(/font-size\s*:\s*([^;{}]+)/gi)) {
    bump(fontSizes, m[1].trim().replace(/\s+/g, ' '));
  }
  for (const m of css.matchAll(/font-weight\s*:\s*(\d{3}|bold|normal|lighter|bolder)/gi)) {
    bump(fontWeights, m[1].trim());
  }
  for (const m of css.matchAll(/letter-spacing\s*:\s*([^;{}]+)/gi)) {
    bump(letterSpacing, m[1].trim());
  }
  for (const m of css.matchAll(/transition(?:-duration)?\s*:\s*([^;{}]+)/gi)) {
    bump(transitions, m[1].trim().replace(/\s+/g, ' '));
  }
  for (const m of css.matchAll(/linear-gradient\([^)]*\)|radial-gradient\([^)]*\)|conic-gradient\([^)]*\)/gi)) {
    bump(gradients, m[0].replace(/\s+/g, ' ').slice(0, 160));
  }
  // spacing: padding / margin / gap, single-value only (the scale lives there)
  for (const m of css.matchAll(/(?:padding|margin|gap|row-gap|column-gap)\s*:\s*(-?[\d.]+(?:px|rem|em))\s*;/gi)) {
    bump(spacing, m[1].trim());
  }
  // custom properties are the closest thing to a declared design system
  for (const m of css.matchAll(/(--[a-z0-9-_]+)\s*:\s*([^;{}]+)/gi)) {
    const name = m[1].trim();
    const val = m[2].trim().replace(/\s+/g, ' ').slice(0, 90);
    if (!cssVars.has(name)) cssVars.set(name, val);
  }
}

// ---------- page identity ----------
const identity = { title: null, description: null, ogImage: null, themeColor: null, favicon: null, logos: [], googleFonts: [], fontFiles: [] };

function harvestHtml(html, base) {
  const pick = (re) => { const m = html.match(re); return m ? m[1].trim() : null; };

  identity.title ||= pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  identity.description ||= pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
  identity.ogImage ||= abs(pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) || '', base);
  identity.themeColor ||= pick(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)/i);
  identity.favicon ||= abs(pick(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)/i) || '', base);

  for (const m of html.matchAll(/<(?:img|source)[^>]+(?:src|srcset)=["']([^"',\s]+)/gi)) {
    const src = m[1];
    if (/logo|brand|wordmark|mark[-_.]/i.test(src)) {
      const a = abs(src, base);
      if (a && !identity.logos.includes(a)) identity.logos.push(a);
    }
  }
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'&][^"']*)/gi)) {
    for (const f of m[1].matchAll(/family=([^&:"']+)/gi)) {
      const name = decodeURIComponent(f[1]).replace(/\+/g, ' ');
      if (!identity.googleFonts.includes(name)) identity.googleFonts.push(name);
    }
  }
  for (const m of html.matchAll(/["']([^"']+\.(?:woff2?|otf|ttf))["']/gi)) {
    const a = abs(m[1], base);
    if (a && identity.fontFiles.length < 20 && !identity.fontFiles.includes(a)) identity.fontFiles.push(a);
  }

  // inline styles carry the hand-written tokens on many marketing sites
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) harvestCss(m[1]);
  for (const m of html.matchAll(/\sstyle=["']([^"']+)["']/gi)) harvestCss('a{' + m[1] + ';}');

  const sheets = [];
  for (const m of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)) {
    const href = m[0].match(/href=["']([^"']+)/i);
    if (href) { const a = abs(href[1], base); if (a) sheets.push(a); }
  }
  for (const m of html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi)) {
    const a = abs(m[1], base);
    if (a && !sheets.includes(a)) sheets.push(a);
  }
  return sheets;
}

// ---------- run ----------
const notes = [];
const fetched = { pages: [], stylesheets: [], failed: [] };

async function doPage(pageUrl) {
  let html;
  try { html = await get(pageUrl); }
  catch (e) { fetched.failed.push({ url: pageUrl, error: String(e.message) }); return; }
  fetched.pages.push(pageUrl);
  const sheets = harvestHtml(html, pageUrl);
  const uniq = sheets.filter((s) => !fetched.stylesheets.includes(s)).slice(0, 25);
  const results = await Promise.allSettled(uniq.map(async (s) => {
    const css = await get(s);
    return { s, css };
  }));
  for (const r of results) {
    if (r.status === 'fulfilled') { fetched.stylesheets.push(r.value.s); harvestCss(r.value.css); }
    else fetched.failed.push({ url: 'stylesheet', error: String(r.reason?.message || r.reason) });
  }
}

const base = new URL(url);
await doPage(base.href);
for (const p of extraPages) await doPage(abs(p, base.href));

if (fetched.stylesheets.length === 0 && colors.size < 5) {
  notes.push('Thin result. This site almost certainly paints its styles with JavaScript at runtime, which this extractor does not run. Treat the numbers below as a floor, and get the real values from a screenshot, the browser inspector, or one of the richer tools.');
}
if (colors.size > 0 && [...colors.keys()].filter((c) => !isNeutral(c)).length === 0) {
  notes.push('Every colour found is a neutral. The brand hue is probably set in JavaScript or an image.');
}

const brandColors = ranked(colors, 40).filter((c) => !isNeutral(c.value)).slice(0, 14);
const neutrals = ranked(colors, 60).filter((c) => isNeutral(c.value)).slice(0, 12);

const out = {
  source: base.href,
  extractedBy: 'extract-brand.mjs (zero-dependency fallback)',
  confidence: fetched.stylesheets.length >= 2 ? 'medium' : 'low',
  notes,
  identity,
  colors: { brand: brandColors, neutral: neutrals },
  typography: { families: ranked(fonts, 12), sizes: ranked(fontSizes, 16), weights: ranked(fontWeights, 8), letterSpacing: ranked(letterSpacing, 6) },
  geometry: { radius: ranked(radii, 10), shadow: ranked(shadows, 8), spacing: ranked(spacing, 16) },
  motion: { transitions: ranked(transitions, 8) },
  gradients: ranked(gradients, 6),
  declaredVariables: Object.fromEntries([...cssVars.entries()].slice(0, 120)),
  fetched,
};

if (asJson) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

const line = (k, v) => console.log(`  ${String(k).padEnd(28)} ${v}`);
console.log(`\nBrand extraction — ${base.href}`);
console.log(`confidence: ${out.confidence}   pages: ${fetched.pages.length}   stylesheets: ${fetched.stylesheets.length}`);
for (const n of notes) console.log(`\n!  ${n}`);
console.log('\nIdentity');
line('title', identity.title || '-');
line('theme-color', identity.themeColor || '-');
line('google fonts', identity.googleFonts.join(', ') || '-');
line('logo candidates', identity.logos.slice(0, 3).join('\n' + ' '.repeat(31)) || '-');
console.log('\nBrand colours (by declaration count)');
for (const c of brandColors.slice(0, 8)) line(c.value, c.count);
console.log('\nNeutrals');
for (const c of neutrals.slice(0, 6)) line(c.value, c.count);
console.log('\nType families');
for (const f of ranked(fonts, 5)) line(f.value.slice(0, 60), f.count);
console.log('\nRadius / shadow / spacing');
for (const r of ranked(radii, 4)) line('radius ' + r.value, r.count);
for (const s of ranked(shadows, 3)) line('shadow ' + s.value.slice(0, 44), s.count);
for (const s of ranked(spacing, 6)) line('space ' + s.value, s.count);
const varCount = cssVars.size;
console.log(`\nDeclared CSS variables: ${varCount}${varCount ? ' (run with --json to see them)' : ''}`);
console.log('');
