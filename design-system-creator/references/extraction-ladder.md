# The extraction ladder — run at the highest rung available, never stop

This skill used to refuse to start until three tools were installed. That was
wrong. Most people who need a design system do not have Firecrawl, and telling
them to go install a CLI before they can see anything is how a skill gets
abandoned on the first run.

So: **detect what is on the machine, run at the best rung available, say which
rung you are on, and finish the job.** Never block. Never invent values to cover
a gap either — a rung you could not reach is reported as unknown, not filled in
from memory.

---

## The four rungs

| Rung | Needs | Gets you | Confidence |
|---|---|---|---|
| **0. Told** | Nothing. The user pastes hex codes, uploads a PDF brand book, attaches screenshots | Whatever they hand you, which for a brand that already has guidelines is the best source that exists | Highest when a real brand book exists, lowest when it is one screenshot |
| **1. Read** | Node 18+, which Claude Code already runs on | Real declared CSS: colour counts, font families, radius, shadow, spacing scale, custom properties, Google Fonts, logo URLs | Medium |
| **2. Rendered** | Playwright + Chromium | Computed values after JavaScript runs, plus a real screenshot, plus logo rasterisation | High |
| **3. Interpreted** | Firecrawl API key | Everything in rung 1 and 2 plus a structured branding payload: personality, component inventory, typography roles, competitor sweep | Highest for a site you cannot otherwise read |

Rungs are cumulative in value, not exclusive. When you have rung 3, still run
rung 1 — two independent reads that agree are worth more than either alone, and
where they disagree you have found something worth asking the user about.

---

## Detect first, in one command

```bash
echo "node:       $(node -v 2>/dev/null || echo MISSING)"
echo "firecrawl:  $(command -v firecrawl >/dev/null 2>&1 && firecrawl --status 2>&1 | grep -o 'Authenticated' || echo MISSING)"
echo "playwright: $(npx --no-install playwright --version 2>/dev/null || echo MISSING)"
echo "chromium:   $(ls ~/Library/Caches/ms-playwright 2>/dev/null | grep -c chromium || echo 0)"
echo "eds:        $(test -f .claude/skills/extract-design-system/SKILL.md && echo OK || echo MISSING)"
```

Read the output, pick your rung, tell the user one sentence:

> "Reading your site directly — that gets colours, fonts and spacing out of the
> CSS. Firecrawl would also read the personality and component inventory; you
> do not need it, and I will say what I could not see."

Then keep going. Do not wait for an answer.

---

## Rung 1 in practice — the bundled extractor

`scripts/extract-brand.mjs` is bundled with this skill and needs nothing installed.
It fetches the page, follows its stylesheets, and ranks every colour, font,
radius, shadow, spacing value and custom property by how often it is declared.

```bash
node scripts/extract-brand.mjs https://example.com
node scripts/extract-brand.mjs https://example.com --json > brands/self/tokens.json
node scripts/extract-brand.mjs https://example.com --pages=/pricing,/about
```

It prints its own `confidence` field. Trust it.

**What it cannot do, and you must say so rather than paper over:**

- It does not run JavaScript. A site that paints its theme at runtime returns a
  thin result, and the script says so in its `notes`.
- It counts declarations, not rendered pixels. Frequency is a strong hint about
  which colour is the primary, not proof.
- It reads no images, so it cannot tell you the logo's colours — only where the
  logo file lives.

When the result comes back thin, escalate the way a person would: ask the user
for a screenshot of their homepage, or for the three hex codes they already
know. A screenshot the user sends in ten seconds beats an install they will
never do.

---

## Rung 2 in practice — Playwright when it happens to be there

Playwright is already installed on a lot of machines for other reasons. When
`npx playwright --version` answers and a chromium build is cached, you get two
things the fetch-based extractor cannot reach:

- **Computed styles.** Load the page, read `getComputedStyle` on the body, the
  headings, the primary button, and a card. That resolves `var(--token)` chains
  to real values and survives runtime theming.
- **A screenshot.** Which is the single best artefact for the parts of a brand
  that no token file captures: photography direction, density, how much air the
  layout leaves.

`scripts/render.mjs` already carries the Playwright bootstrap; reuse it rather
than writing a second one.

If Playwright is missing, **do not install it unasked.** It is a 200 MB
download. Mention it once, as an upgrade, and carry on at rung 1.

---

## Rung 3 in practice — Firecrawl when the user has it

```bash
firecrawl scrape <url> --format markdown,branding --full-page-screenshot --wait-for 5000 -o brands/self/homepage.json --json
```

The `branding` format is the reason this rung exists: it returns a structured
brand kit rather than raw CSS, including the parts that need judgement rather
than parsing (personality, typographic roles, component inventory). It is the
best single call in this skill when the user has a key.

Free tier is 500 credits a month and a full run costs 15 to 25, so a user who
has an account will not run out. Mention it as the upgrade **after** you have
delivered something at a lower rung, never as a gate before.

---

## Filling the gaps a lower rung leaves

Every rung leaves something unknown. Fill each one in this order: **ask, then
observe, then leave blank. Never guess.**

| What is missing | Ask for | If they cannot supply it |
|---|---|---|
| Brand hue | "What is your primary colour? A hex code or a screenshot both work" | Take the most-declared non-neutral from rung 1, and label it `unconfirmed` in `color.md` |
| Font names | "What fonts does your site use?" | Report the Google Fonts links found; if none, write `unknown` |
| Logo geometry | The logo file, any format | Do not draw a logo. Deliver the folder without one and say the logo slot is empty |
| Voice | Three sentences they have actually published | Quote real copy from the page you fetched. Never write voice rules a brand does not already exhibit |
| Photography direction | "Point me at two images you are happy with" | Write the rule as `unknown` and say what would settle it |
| Personality | Two adjectives from the user | Leave `brand.md`'s personality section marked as needing their input |

> A design system with three honest `unknown` fields is usable. A design system
> with three invented hex codes is worse than nothing, because the next person
> to open it will believe them.

---

## What never changes, at any rung

The non-negotiables in `non-negotiables.md` are defaults for a brand-new system,
not tooling. On an existing brand, the brand's own rules win (see the scope note
at the top of that file). Either way, the rung you are on never changes them.
Same for the asset-fidelity rules: a real
published asset always beats a synthetic recreation, and the logo gets rendered
faithfully or not at all.

And the deliverable never shrinks. Every rung produces the full
`design-system/` tree. The rung decides how much of it is measured versus
asked for versus marked unknown — it does not decide how many files you deliver.
