# Setup — optional upgrades, not prerequisites

**Nothing in this file is required.** The skill runs with nothing installed but
Node, which Claude Code already provides, and the bundled
[scripts/extract-brand.mjs](../scripts/extract-brand.mjs) does real extraction
at that level. See [extraction-ladder.md](extraction-ladder.md) for the four
rungs and how to fill what a lower rung leaves out.

This file exists for the user who wants the higher rungs. Offer them **after**
you have delivered something, never as a gate before. Do not install anything
unasked, and never install Chromium unasked, because it is a 200 MB download.

---

## The three optional upgrades

| Tool                         | What it adds over the bundled extractor                                           |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **Firecrawl CLI**            | Scrapes the homepage(s) + extracts the `branding` format (colors, fonts, typography, spacing, components, logo URL, personality). Also runs keyword search when the user can't name enough references. |
| **extract-design-system**    | NPM-based Playwright CLI that returns independent, CSS-computed tokens (color palette, spacing scale, typography). Cross-checks Firecrawl's LLM-inferred values. |
| **Playwright Chromium**      | Runs both extract-design-system and the `scripts/render.mjs` rendering pipeline (SVG logo + template rasterization). |

All three run locally on the user's machine. No cloud infrastructure is needed beyond Firecrawl's hosted API.

---

## Quick one-command setup

If the user has none of the three installed and is comfortable running commands, this one line installs everything except the Firecrawl API key:

```bash
npx -y firecrawl-cli@latest init --all --browser
```

This command:
- Installs `firecrawl-cli` globally.
- Installs 12 Firecrawl skills (search, scrape, interact, build, etc.). In a shared workspace, check where these land before running it from the workspace folder: skills added there reach everyone at the next save.
- Opens the user's browser to sign in / sign up to Firecrawl and obtain an API key.
- Stores the key for the CLI automatically.

The `--browser` flag triggers the sign-in dance. If the user already has a key, they can use `-k fc-<their-key>` instead and skip the browser step:

```bash
npx -y firecrawl-cli@latest init --all -k fc-YOUR_KEY_HERE
```

After that, run Playwright's one-time Chromium installer:

```bash
npx playwright install chromium
```

`extract-design-system` is a separate third-party tool. This skill never installs it or adds it to the workspace. If it's already on the machine, the detector finds it and it serves as a second opinion; otherwise the bundled extractor covers the same ground.

Then install Playwright as a project-local dep so the `scripts/render.mjs` script can import it:

```bash
npm init -y >/dev/null 2>&1
npm install playwright
```

---

## Verifying each tool

### Firecrawl

```bash
firecrawl --status
```

Expected output includes `Authenticated via stored credentials` and a credit count (typically 500 on a new free account).

If the command returns "not found": Firecrawl CLI isn't installed. Run the one-command setup above.

If the command returns "not authenticated": the API key wasn't saved. Re-run with `-k fc-<key>` or use `firecrawl init --browser` to re-auth.

If the credit count is `0`: the account is out of credits. Warn the user. Each scrape is ~1 credit, each search is ~1 credit — a full Branch A run is ~15–25 credits.

### extract-design-system

```bash
ls .claude/skills/extract-design-system/SKILL.md
```

If it exists: the skill is present. You can call `npx --no-install extract-design-system <url>` to invoke it.

If it doesn't exist: carry on without it. Do not fetch or install it.

### Playwright Chromium

```bash
npx --no-install playwright --version
```

Should print a version like `Version 1.59.1`. If the command fails or prompts to install: run `npx playwright install chromium`.

To verify Chromium specifically is present (Playwright sometimes reports "installed" but Chromium isn't downloaded):

```bash
ls ~/Library/Caches/ms-playwright 2>/dev/null | head -5
```

On macOS, you should see a `chromium-<build>` directory. If empty, run `npx playwright install chromium`.

---

## The detector you run at the start of every skill invocation

Run this, read it, pick your rung, say the rung in one sentence, and keep going.
It is a detector, not a gate.

```bash
echo "=== Firecrawl ==="; firecrawl --status 2>&1 | head -5 || echo "FIRECRAWL_MISSING"
echo "=== extract-design-system ==="; test -f .claude/skills/extract-design-system/SKILL.md && echo "OK" || echo "EDS_MISSING"
echo "=== Playwright / Chromium ==="; npx --no-install playwright --version 2>&1 | head -1 || echo "PLAYWRIGHT_MISSING"
```

Nothing here stops the run. A `MISSING` line changes your rung, which changes your
confidence and what you mark unknown. It never changes whether you deliver, and it
never licenses a guess. `node` alone is rung 1 and rung 1 always works.

---

## What to tell the user if something is missing

Only bring these up **after** you have handed over work at the rung you had, and
only when the missing tool would have changed the result. One sentence, framed as
an upgrade they can take or leave, never as a blocker. Do not dump the whole
setup on them if only one thing is missing.

### Firecrawl missing

> I need Firecrawl to scrape the reference/website data. It's a quick one-time install. Run this and come back:
>
> ```bash
> npx -y firecrawl-cli@latest init --all --browser
> ```
>
> It'll open your browser to sign up (free — 500 scrapes/month). Come back when you see "Authenticated" and "500 / 500 credits."

### extract-design-system missing

Say nothing. The bundled extractor covers the same ground, and this skill never installs third-party skills into the workspace.

### Playwright Chromium missing

> One-time install for the headless browser we use to render logos:
>
> ```bash
> npm install playwright
> npx playwright install chromium
> ```
>
> First command is instant; Chromium download is ~200 MB. Come back when it's done.

---

## What the user needs, in plain terms

Strip the jargon and tell them the human version when they ask:

- **Firecrawl** — "Scrapes websites cleanly. We'll use it to read the competitor sites you mention, or your own website if we're extracting an existing brand. Free account, 500 scrapes/month."
- **extract-design-system** — "A small helper that visits a website and reads the real CSS to find exact colors, fonts, and spacing. Complementary to Firecrawl."
- **Playwright Chromium** — "A headless browser. We use it to render your new logo into JPG and PNG, and to verify the extract-design-system tool works. One-time install."

---

## Fully offline

No network at all is rung 0, and rung 0 is a real rung, not a failure state. The
user's own material is the highest-fidelity source of their brand that exists.

Ask for, in this order: a brand book or style guide PDF, the logo files, a
screenshot of the homepage, three hex codes they already know, and two published
assets they are happy with. That set produces a better design system than a scrape
of a site they never liked.

What you cannot measure offline you ask for. What they cannot supply you mark
`unknown` in the file where it belongs, with one line on what would settle it.
You still deliver every file in the tree. Say once, plainly, that colour and type
came from what they told you rather than from their live site.
