#!/usr/bin/env node
/*
 * Lantern-style design-system renderer.
 *
 * Takes self-contained SVG files and renders them to JPG + PNG offline using the
 * Chromium installed by Playwright. Used by the design-system-creator skill
 * to rasterize logo lockups and asset templates.
 *
 * Usage:
 *   node render.mjs <svg-path> [<svg-path> ...]
 *
 *   Or with explicit dimensions (width×height) and optional background:
 *   node render.mjs path/to/logo.svg --width 1600 --height 400 --bg "#FBFAF7"
 *
 * Produces: <svg-path-without-extension>.jpg and .png alongside the input.
 *
 * Prerequisites (installed once per project):
 *   npm install playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

// ── Argument parsing ──────────────────────────────────────────
const args = process.argv.slice(2);
const svgPaths = [];
let width = null;
let height = null;
let bg = '#FBFAF7';

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--width')       { width = Number(args[++i]); }
  else if (a === '--height') { height = Number(args[++i]); }
  else if (a === '--bg')     { bg = args[++i]; }
  else if (a.endsWith('.svg')) { svgPaths.push(a); }
}

if (svgPaths.length === 0) {
  console.error('Usage: node render.mjs <svg-path> [--width N] [--height N] [--bg #RRGGBB]');
  process.exit(1);
}
if (!/^#[0-9a-f]{6}$/i.test(bg)) throw new Error('--bg must be #RRGGBB');
for (const size of [width, height]) {
  if (size !== null && (!Number.isInteger(size) || size <= 0 || size > 8192)) {
    throw new Error('Dimensions must be whole pixels from 1 to 8192');
  }
}

// ── Infer default dimensions from the SVG's viewBox if not provided ──
function inferDimensions(content) {
  const vbMatch = content.match(/\bviewBox\s*=\s*["']([^"']*)["']/);
  const viewBox = vbMatch?.[1].trim().split(/[\s,]+/).map(Number);
  if (viewBox && (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0)) {
    throw new Error('viewBox must contain four finite numbers with positive width and height');
  }
  const w = width ?? (viewBox ? Math.ceil(viewBox[2] * 2) : 1200);
  const h = height ?? (viewBox ? Math.ceil(viewBox[3] * 2) : 630);
  // Bound both viewport dimensions and the 2x-density raster allocation.
  if (w > 8192 || h > 8192 || w * h * 4 > 64 * 1024 * 1024) {
    throw new Error('Render exceeds 8192 pixels per side or 64 megapixels at 2x density');
  }
  return { width: w, height: h };
}

async function readSvg(svgPath) {
  const file = await fs.open(svgPath, 'r');
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > 16 * 1024 * 1024) {
      throw new Error('SVG must be a regular file no larger than 16 MiB');
    }
    // Read at most the checked size plus one byte; a growing file cannot bypass the limit.
    const buffer = Buffer.alloc(info.size + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await file.read(buffer, length, buffer.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > info.size) throw new Error('SVG changed while reading; retry with a stable file');
    return buffer.subarray(0, length).toString('utf8');
  } finally {
    await file.close();
  }
}

// ── Rendering ─────────────────────────────────────────────────
const browser = await chromium.launch();

try {
 for (const svgPath of svgPaths) {
  const svg = await readSvg(svgPath);
  const { width: w, height: h } = inferDimensions(svg);
  const base = svgPath.replace(/\.svg$/, '');

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; background: ${bg}; }
  body {
    width: ${w}px; height: ${h}px;
    display: flex; align-items: center; justify-content: center;
  }
  img { width: 100%; height: 100%; display: block; }
</style>
</head>
<body><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt=""></body>
</html>`;

  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2,
    javaScriptEnabled: false, serviceWorkers: 'block' });
  try {
    await ctx.route('**/*', route => route.request().url().startsWith('data:') ? route.continue() : route.abort());
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.locator('img').evaluate(image => image.decode());
    await page.screenshot({ path: `${base}.png`, type: 'png' });
    await page.screenshot({ path: `${base}.jpg`, type: 'jpeg', quality: 92 });
    console.log(`✓ rendered ${path.basename(svgPath)} → ${base}.png + .jpg (${w}×${h})`);
  } finally {
    await ctx.close();
  }
 }
} finally {
  await browser.close();
}
