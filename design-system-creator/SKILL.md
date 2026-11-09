---
name: design-system-creator
description: Build a brand's living style guide on a /design canvas, then turn it into a design system for Claude Design and reusable assets. Use when asked to build a new brand or codify an existing one from its website and approved assets. Run only when explicitly requested.
disable-model-invocation: true
---

# Design System Creator

Built for AIOS workspaces: an existing brand's own rules win, the workspace's brand and client context is read first, and the finished system is saved inside the room that owns the brand.

This skill builds the brand on a `/design` canvas first: references, the website split into its parts, and a living style guide the user shapes round by round. Once the user says the canvas is right, it turns it into a complete, portable **design system folder** — the kind a modern brand uses as the single source of truth for every asset it ever publishes: web, landing pages, pitch decks, Instagram carousels, LinkedIn carousels, emails, infographics, ads, and everything else.

The final output is a folder that can be:

- uploaded directly to **Claude Design's "Set up your design system"** flow,
- fed as context to any LLM that produces brand assets,
- referenced by a design team as a living style guide.

## Step 0 — Detect what the machine has, then start anyway

This skill never blocks on a missing tool. It runs at the best rung available,
says which rung that is in one sentence, and delivers the full design system
either way. The one thing it will not do is invent a value to cover a gap.

Run the detector:

```bash
echo "node:       $(node -v 2>/dev/null || echo MISSING)"
echo "firecrawl:  $(command -v firecrawl >/dev/null 2>&1 && firecrawl --status 2>&1 | grep -o 'Authenticated' || echo MISSING)"
echo "playwright: $(npx --no-install playwright --version 2>/dev/null || echo MISSING)"
echo "chromium:   $(ls ~/Library/Caches/ms-playwright 2>/dev/null | grep -c chromium || echo 0)"
echo "eds:        $(test -f .claude/skills/extract-design-system/SKILL.md && echo OK || echo MISSING)"
```

| What answered | Rung you are on | What you use |
|---|---|---|
| Nothing but the user | **0 — Told** | Their hex codes, brand book PDF, screenshots. Best source there is when a real brand book exists |
| `node` | **1 — Read** | [scripts/extract-brand.mjs](scripts/extract-brand.mjs), bundled, zero install, zero API key. Real declared CSS: colours by frequency, font families, radius, shadow, spacing scale, custom properties, Google Fonts links, logo URLs |
| `playwright` + a chromium build | **2 — Rendered** | Computed styles after JavaScript runs, a real screenshot, logo rasterisation via [scripts/render.mjs](scripts/render.mjs) |
| `firecrawl` authenticated | **3 — Interpreted** | `--format branding`, the structured brand kit: personality, component inventory, typographic roles, competitor sweep |

Node is always there, because Claude Code runs on it. **So rung 1 is always
available and there is never a reason to stop.** Rungs 2 and 3 are upgrades you
mention once, after you have handed something over, never as a gate before.

Full guidance, including exactly how to fill the gaps each rung leaves without
guessing, is in [references/extraction-ladder.md](references/extraction-ladder.md).
Read it before Branch B. Install instructions for the optional tools are in
[references/setup.md](references/setup.md).

> Say the rung out loud, once, in the user's terms: *"Reading your site directly,
> which gets colours, fonts and spacing out of the CSS. I will flag anything I
> could not see."* Then keep going.

## Step 0.5 — Find whose brand this is, and read what the workspace already knows

Settle these before the interview.

**Whose brand.** If the request doesn't say, ask: is this the business's own brand, or a client's? The answer decides what you read and where the finished system lives.

**What the workspace already holds.** In an AIOS workspace every room has a `context.md` that routes to its files. Read the owning room before touching the web:

- **The business's own brand:** the brand room under `marketing/` (visual identity, how the business describes itself, what to avoid) and the voice file it points to.
- **A client's brand:** that client's folder under `clients/`, starting with its `context.md`. If the workspace has a skill that pulls the client's brief form (for example `/pull-form`), use it. Ask where the client's supplied assets live (often a shared Drive folder of logos, photos and brand files) and read them through the connected Drive tool.

Anything the workspace has written down, and anything the client supplied, is the brand's rules doc. It outranks every scrape (see the reconciliation order in [references/branch-b-extract.md](references/branch-b-extract.md)).

**Where files go.**

- The finished `design-system/` folder lives inside the room that owns the brand: the brand room for the business's own brand, the client's folder for a client. It is a new folder, so confirm the location with the user before writing and follow the workspace's folder rules. Give it a short `context.md` that says what it is and points to its `CLAUDE.md`, and add a line to the owning room's index so the next session finds it.
- Working files (scrapes, screenshots, extracted tokens, the reconciliation table, research notes) go in the session's scratch or temp directory, never in the workspace. Wherever the references write to `brands/`, `research/` or `.firecrawl/`, create those under the scratch directory.

## The first interview question

Once the tools are in place, ask the user exactly **one** question to figure out which path they're on:

> **Are we creating a brand-new design system from scratch, or are we extracting the design system from a business you already run?**

Don't branch, don't suggest, don't assume. Their answer picks one of two workflows:

- **"New / from scratch / nothing yet"** → Branch A. Load [references/branch-a-fresh.md](references/branch-a-fresh.md).
- **"Existing business / existing site / existing brand"** → Branch B. Load [references/branch-b-extract.md](references/branch-b-extract.md).

If the answer is ambiguous ("we have a logo but nothing else," "we've been running for a year but it's all ad-hoc"), they're almost certainly on Branch B — extraction — because you have real artifacts to work from. Confirm this with them before proceeding.

## What the skill produces

Use the [output tree and field specifications](references/output-structure.md) for the complete design-system folder. The asset-fidelity rules below take precedence.

## The asset-fidelity rules — read before either branch

These two rules apply on **both branches** and override the "produce every file" instinct. Real artifacts beat synthetic recreations every time.

### Rule 1 — When the user provides published assets, use them as templates. Do NOT recreate them.

If the user has handed you (or you've discovered in their working directory) any of: a one-pager PDF, a pitch deck, slide-template library, IG/LinkedIn carousels, ads, OG images, email screenshots, or any other published asset that demonstrates the brand's look — **copy those files into `design-system/assets/templates/` and reference them as the canonical templates.**

Do not write synthetic SVG recreations of carousel covers, OG images, LinkedIn posts, or any other surface for which the user already has a real version. A synthetic recreation will look "lazy" next to the real published artifact, and pasting it into a downstream tool (Claude Design, a designer's brief) will degrade the brand. The user's own assets are the highest-fidelity version of the brand that exists.

Concretely:
- **Browse the brand's own files before generating templates.** Look for `*.pdf`, `*.png`, `*.jpg` files in the brand's folder, its supplied assets, subfolders that look organized (e.g., `slide-templates/`, `decks/`, `social/`, etc.), and any folder the user mentioned. Never sweep the whole workspace, which holds other brands' files.
- **Copy real assets into `assets/templates/<surface>/` preserving structure.** E.g., a 28-template slide library lives in `assets/templates/deck-slides/<category>/<file>.png`.
- **Replace the asset-templates section of [output-structure.md](references/output-structure.md) with the real files** in your generated `README.md` for `assets/templates/`. Document which template to pick by content shape ("3 ideas equal weight → file X"), not by your made-up filename.
- **Only generate synthetic templates when no real asset exists for that surface, AND** explicitly flag each synthetic asset to the user with: *"I drafted this — let me know if it should be replaced with one of your real published versions."* On Branch A (fresh brand), every template is synthetic by definition; on Branch B, synthetic templates should be the exception, not the default.
- **Do not delete a real asset to make room for a synthetic one.** If the user provides a deck library *and* a YouTube intro slide, keep both. Templates are not deduplicated by surface — they're the user's canon.

### Rule 2 — When you render the logo, render it faithfully. Do NOT add features.

If the user provides a logo (file upload, website-scraped raster, or a clean reference photo of the asset in use), render an SVG that matches what's actually there. Don't add eye dots to a smiley that has none. Don't add a serif tail to a sans wordmark. Don't "improve" a 2-stroke mark by adding decorative elements. The brand owns the logo — the logo is what it is.

After producing logo SVGs, **diff your output against the source visually**: render the SVG with [scripts/render.mjs](scripts/render.mjs), open both side by side, and confirm every visible feature (and only those features) is present. If the source logo has lower resolution than you'd like, ask the user for a higher-res version — don't invent details to "clean it up."

If you're uncertain about a feature ("does this circle have eye dots or just a smile?"), zoom into the highest-resolution copy you can find and confirm before generating. When in doubt, render the simpler version and ask the user to confirm.

---

## The non-negotiables — defaults for a brand-new system

These are the design laws for **Branch A**, where you build a brand from nothing. They are what make a new system *feel* disciplined rather than generic. Full reasoning in [references/non-negotiables.md](references/non-negotiables.md); summary:

1. **One primary color.** Pick one confident hue. No "palette" of three competing primaries. Everything else is shades of ink (text) and semantic feedback colors.
2. **One typeface family.** Sans-serif. Ideally Inter (free, universal). A distinctive display face is allowed if licensed, but never two display faces. No script, no serif (serif is only allowed for very long-form legal/contract PDFs).
3. **One canvas choice.** Either warm off-white or pure white — pick one and use it consistently for marketing. Pure white feels clinical, warm off-white feels calm — choose based on the brand's personality, then commit.
4. **Sentence case for all headlines.** No Title Case. No ALL CAPS except in a ≤3-word overline.
5. **No hype vocabulary on public surfaces.** Banned everywhere: *revolutionary, game-changing, 10x, cutting-edge, supercharge, unleash, leverage, transform, synergy, seamless, robust, AI-powered (as a bare adjective).*
6. **Voice rules:** second-person singular ("you"), short sentences, name the user's world (their nouns: *chair, shop, appointment, chart, ticket*), not ours (*agent, LLM, platform, pipeline*).
7. **Imagery direction:** real photography of actual humans or spaces from the brand's context. No stock "diverse team around a laptop." No AI-generated humans. No generic "AI" visuals (glowing orbs, neural meshes, wireframe globes).
8. **Motion is minimal.** Fade + small translate. 160/240/480ms durations. No parallax, no looping hero video, no scroll-jacking, no confetti.
9. **No gradients-over-everything, no glassmorphism, no 3D, no neumorphism.** Calm, flat, confident.
10. **Every claim gets a number or a name.** "Saves time" is banned; "saves 4 hours a week" is required. Use real client names or acknowledge the data source.

**On Branch B the brand already exists, and its own rules win.** If it uses a serif, two brand colours, pure white, Title Case headlines or its own vocabulary, codify exactly that. Never push back on it, "correct" it or quietly modernise it. Record the brand's real rules as its non-negotiables in `CLAUDE.md`. Raise a genuine problem, such as text that fails contrast, once as a note for the user to decide on.

On Branch A, if a design choice violates one of these defaults, push back and propose the on-brand alternative.

## The canvas — a living style guide, then the system

Every run builds the brand on one `/design` canvas before any `design-system/` file is written. Read [references/canvas.md](references/canvas.md) before either branch. In short:

- **References go on the canvas as a mood board.** When the user brings references straight away, put them up and start creating from them. Always recommend three to five more, marked as suggestions.
- **A website link gets split into its parts** (nav, hero, buttons, cards, forms, footer) and each part goes on the canvas as its own editable artboard, captioned with the values it uses.
- **Push the questioning.** After each round, ask two or three pointed questions, change the canvas and ask again. Don't rush the user to sign off.
- **The style guide renders live on the same canvas**: colours, type, logo, spacing, radius, shadow, motion, imagery and voice, following [references/brand-teardown.md](references/brand-teardown.md).
- **The canvas is the approval gate.** Corrections go token by token (section, value, fix). The `design-system/` folder is generated only when the user says the style guide is right, with every value exactly as the canvas shows it. **Silence is not approval; nothing is written before sign-off.**

This gate exists because a wrong primary hex or a misidentified font propagates into every one of the ~40 files this skill produces. A few rounds on the canvas are cheaper than regenerating the folder. If `/design` isn't available, fall back to the brand teardown page described in [references/brand-teardown.md](references/brand-teardown.md).

## Branch A — Fresh

Read and follow [the fresh-brand playbook](references/branch-a-fresh.md). Use the detected tools; settle the direction on the canvas and get the style guide approved before generating the system.

## Branch B — Extract

Read and follow [the extraction playbook](references/branch-b-extract.md) and [extraction ladder](references/extraction-ladder.md). Reconcile the actual brand sources, break the site down on the canvas and get the style guide approved before generating the system.

## Tools you have available

**Always present, no install:**

- **[scripts/extract-brand.mjs](scripts/extract-brand.mjs)** — the bundled extractor. `node scripts/extract-brand.mjs <url> [--json] [--pages=/pricing,/about]`. Fetches the page, follows its stylesheets, ranks every colour, font, radius, shadow and spacing value by declaration count, and lists the declared CSS custom properties. Prints its own `confidence`. This is rung 1 and it always works.
- **File tools** (Write, Edit, Read) — produce markdown and token files from the templates.
- **The user** — the highest-value source in the skill. A brand book PDF, three hex codes, or one homepage screenshot beats any scrape. Ask early.

**Optional upgrades, used when detected, never installed unasked:**

- **Firecrawl connector** — if one is connected in this session, use it for web search and page reads where its tools cover them. The CLI's `branding` format below is the richer call when it's installed.
- **Playwright Node.js** — [scripts/render.mjs](scripts/render.mjs) renders SVG logos and template SVGs to JPG and PNG, and can read computed styles after JavaScript runs. `npm install playwright && npx playwright install chromium` is a ~200 MB download, so mention it, do not force it.
- **Firecrawl CLI** — `firecrawl scrape <url> --format markdown,branding --full-page-screenshot`. The `branding` format returns a structured brand kit rather than raw CSS, which is the best single call in this skill when the user has a key. Free tier is 500 credits a month; a full run costs 15 to 25. Set up with `npx -y firecrawl-cli@latest init --all --browser`.
- **extract-design-system** (`npx --no-install extract-design-system <url>`) — independent CSS-computed tokens, useful as a second opinion against rung 1. Needs Chromium. Used only if it is already installed.

**The rule:** a missing tool changes your confidence and what you mark unknown. It never changes whether you deliver, and it never licenses a guess. When two sources disagree, name both and say which you used.

## The final deliverable — always produce this

At the very end, regardless of branch, output two blocks of text the user can paste directly into Claude Design's setup form:

1. **Company name and blurb** — under 80 words. Name + what the business does + for whom + the list of asset surfaces it will publish.
2. **Any other notes?** — ~200–300 words. The most critical non-negotiables + specific visual/voice overrides that should bias Claude Design's output. Exact format in [references/claude-design-form.md](references/claude-design-form.md).

Do not skip this step. It is the hand-off and the whole point of producing the system in the first place.

## After the system exists

A design system that exists but is never used is shelf-ware. Once it's approved, point the user to the next step:

- **Templates for each format.** Build a template for each surface the brand publishes (website sections, Instagram carousel, static post, story, LinkedIn post, deck slides). Start from the brand's real published examples in `assets/templates/` and approve each one on the brand's style guide canvas, so the templates sit beside the system they use. Build templates on the system's roles (brand, ink and paper colours, type scale, spacing, radius), never fixed hex values or font names, so a shared layout can be re-skinned with another brand's system. Keep shared base layouts separate from a brand's approved versions; an approved version is saved with that brand.
- **A skill for each repeatable job.** Use the workspace's own skill-building skill (for example `/skill-builder`) to turn a recurring design job into a skill. It reads this design system and the right template, takes the content as input, and finishes in the `/design` canvas for the final adjustments.

## Where to go next

- **The canvas, the living style guide and the approval gate**: [references/canvas.md](references/canvas.md) — read before either branch
- **Which rung you are on and how to fill its gaps**: [references/extraction-ladder.md](references/extraction-ladder.md) — read before Branch B
- **Optional tool setup**: [references/setup.md](references/setup.md) — upgrades, not prerequisites
- Branch A full playbook: [references/branch-a-fresh.md](references/branch-a-fresh.md)
- Branch B full playbook: [references/branch-b-extract.md](references/branch-b-extract.md)
- Style guide parts, and the HTML fallback when there's no canvas: [references/brand-teardown.md](references/brand-teardown.md)
- Brand teardown HTML template: [assets/brand-teardown-template.html](assets/brand-teardown-template.html)
- Output spec (what every file should contain): [references/output-structure.md](references/output-structure.md)
- Non-negotiables + reasoning: [references/non-negotiables.md](references/non-negotiables.md)
- Claude Design hand-off text: [references/claude-design-form.md](references/claude-design-form.md)
- Rendering script: [scripts/render.mjs](scripts/render.mjs)
- Bundled token, logo, component and asset templates: [assets/templates/](assets/templates/); generate voice and application guides from the output specification.
