# The style guide parts, and the teardown page

This file sets what the style guide shows and how it's reviewed. **On the canvas** (the default,
see [canvas.md](canvas.md)), each of the parts below is its own artboard in the style guide section,
next to the references and site breakdown. **When there's no canvas,** the same parts go on one
self-contained HTML page built from the bundled template at
[assets/brand-teardown-template.html](../assets/brand-teardown-template.html).

Either way it's shown **after tokens are extracted (Branch B) or assembled and signed off (Branch A),
and before any `design-system/` file is written**. It is the review gate: the user approves what
they see, or corrects it, and only then does generation start.

## The flow

1. **Render.** Copy the template, fill every `{{PLACEHOLDER}}` with the brand's real, verified value,
   delete the sections the brand has no data for, and delete the instruction comments. Publish it for
   review: **on the canvas as artboards; with no canvas, as an artifact when artifact publishing is
   available, otherwise as a local HTML file opened for the user.**
2. **The user reviews.** They either approve, or disagree and give feedback. Corrections go token by
   token: **section, value, fix** ("03 Color — primary is `#0A6B4F`, not `#12805E`").
3. **Apply, re-render, ask again.** Update the tokens, re-render the same artboards or page, show it again. Loop
   until the user explicitly approves.
4. **Only after explicit approval** does the skill generate the final `design-system/` folder
   (tokens/, foundations/, logo/, components/, applications/, voice/ — the full tree in SKILL.md).
   **Silence is not approval. Ambiguity is not approval. Nothing is written before sign-off.**

This gate exists because a wrong primary hex or a misidentified font propagates into every one of the
~40 files the skill produces. Ten seconds of visual review is cheaper than regenerating the folder.

## The design-first rule

**The teardown SHOWS, it does not explain.**

- Every token renders live: a swatch painted in the color, a heading set at the actual size and
  weight, a box wearing the actual radius and shadow, a button running the actual hover.
- Text is captions — one or two short sentences, never paragraphs. If something can be shown
  visually, it gets no wall of text beside it.
- **Skip sections the brand has no data for.** Delete the whole section and its contents chip. Never
  pad with invented values; tag anything extracted at low confidence with the visible
  `unverified` chip instead. A guess presented as a fact is the worst failure this page can have.

## The 13 parts, in order

The template carries all of these; delete what the brand lacks, keep the order of what remains.

1. **Header** — the brand's real logo (pasted, never redrawn), a file-count chip
   (`design-system/ · N files · N folders · every value measured`), and the review-gate framing:
   "Every token, rendered live. Review, then approve or correct at the end. Silence is not approval."
2. **Contents chips** — one anchor chip per section that actually appears.
3. **01 Identity** — positioning axes (dot on a track between two poles), personality chips, and the
   signature headline device rendered on a real headline *if the brand has one*.
4. **02 Logo** — construction geometry (only if measured from the real file), variants on their
   grounds, the logo file inventory table, clear space and minimum sizes, and the never-list.
5. **03 Color** — surface/ink/brand ramps as live swatches with hex + usage labels; tint/accent cards
   each carrying a **measured** contrast ratio and an AAA/AA/FAIL grade chip; semantic pairs rendered
   as wash + text; the **worst-pairing callout** (the most tempting failing combination shown live
   with its ratio); and the full measured contrast table. Ratios are computed, never estimated.
6. **04 Typography** — one card per typeface, the full scale rendered **at true size** with metrics
   beside each step, the signature device spec (if one exists), the brand's type rules, and context
   pairings (which sizes go together on which surface). Sample lines come from the brand's own copy,
   never lorem ipsum.
7. **05 Iconography** — live icon chips using real glyphs from the brand's library, the size table,
   and the bans.
8. **06 Shape & depth** — the shadow scale with each card wearing its level, the radius scale with
   each corner rendered, and a **working hover demo** if the brand has an interaction signature.
9. **07 Spacing** — scale bars whose width *is* the step, plus the container-width table and section
   rhythm.
10. **08 Motion** — duration tokens, easings, and allowed-vs-banned lists. Skip entirely when motion
    was never measured or stated.
11. **09 Dark / secondary surface** — *only if the brand has one*: a small scoped demo panel wearing
    that surface's real tokens, with real or visibly redacted content, plus the boundary rule for
    where the surface may appear.
12. **10 Imagery** — do-rules and bans as short list items; texture/pattern tiles rendered live if
    the brand has them.
13. **11 Voice & vocabulary** — words-to-use vs words-to-avoid, 2–3 real published headlines as
    specimens, and the brand's **proof numbers** as stat blocks (verified numbers only).

Then **12 Hard rules** — a grid of banned cards, one card per non-negotiable with a one-sentence
reason — and the **footer approval gate**: "Approve" / "Request corrections" buttons (framing — the
user answers in chat), the token-by-token correction instruction, and "Silence is not approval."

## Rules

- **Self-contained.** All CSS inline in one `<style>` block. Web fonts may load from Google Fonts
  when the brand's typefaces are there; otherwise use the closest system stack and caption it as a
  stand-in.
- **The page is styled BY the candidate tokens.** The `:root` block holds the brand's real values, so
  reviewing the page is reviewing the system.
- **Label every specimen with its raw value and usage.** A swatch shows hex + role; a type row shows
  family, size, weight, tracking, and where it's used.
- **Mark confidence.** Anything extracted at low confidence, inferred, or filled by fallback gets the
  visible `unverified` chip. Never present a guess as a fact.
- **No heavy assets on the HTML page.** No screenshots, no base64 images except (optionally) the logo.
  On the canvas, images are uploaded and addressed by their upload address, so the references and
  site breakdown can carry them.
- **The review happens on the canvas.** The HTML page is the fallback when `/design` isn't available.

## After the review

- **Approved** → generate the `design-system/` folder with the tokens exactly as shown.
- **Corrections** → apply them token by token, re-render, show again. Loop until approved.
- **No reply / ambiguity** → ask again. Silence is not approval, and generation stays blocked until
  the user says yes.
