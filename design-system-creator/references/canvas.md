# The canvas: a living style guide first, the system second

Every run builds the brand on one `/design` canvas before any `design-system/` file is
written. The canvas is where the user sees the brand, reacts to it and shapes it. It grows
into a living style guide, and only once the user says it's right does the skill turn it
into the design system folder.

## Set it up

Create one canvas through `/design`'s own type, named `<Brand> style guide`, and follow the
instructions that arrive with it. Where they speak, they govern; never restate or override
them. Upload every image the canvas shows and address it by the address the upload returns,
never by file name.

One canvas holds the whole brand, in this order, left to right:

1. **References**: the mood board.
2. **Site breakdown**: the brand's own website split into its parts, when there's a site.
3. **Direction**: options to choose between (Branch A).
4. **Style guide**: the brand rendered live, the parts listed in
   [brand-teardown.md](brand-teardown.md).
5. **Templates**: added later, when the user builds templates for each format.

Skip a section the brand has nothing for. Never pad one with invented content.

## References: the mood board

- **When the user brings references straight away** (sites, Pinterest pins, screenshots,
  motion clips, logo sketches), put them on the board at once and start creating from them.
  Don't hold them back for an interview first.
- **Group them**: Love, Colour, Type, Layout and density, Imagery, Motion, and Not us (the
  anti-references). Caption each item in a few words with what the user said draws them.
  No essays.
- **Always recommend more.** Suggest three to five references the user didn't bring, each
  with one line on why: one that shows what the category looks like, one that shows it done
  in a current style, and one premium brand that sets the quality bar. They go on the board
  marked as suggestions, and stay only if the user keeps them.
- **Public reads only.** If a Pinterest board or a pin needs a login, ask the user to drop
  the images in.

## Site breakdown: the website in parts

When the user gives a website link, split the site into its parts and put each one on the
canvas as its own artboard: nav, hero, buttons, cards, forms, testimonials or proof, footer,
and any section the brand repeats.

- Rebuild each part from the page's own markup and the CSS the extractor reads
  (`scripts/extract-brand.mjs`), so the part on the canvas is editable, not a picture.
- When a screenshot is available (rung 2 or 3, or the built-in browser), place the original
  beside the rebuild so the user can check it matches.
- Caption each part with the values it uses: colours, font, size, radius, spacing.
- Mark anything the extraction couldn't confirm with an `unverified` tag.

On Branch B this is the brand's own site. On Branch A it can be a reference site the user
loves, broken down so they can point at the exact part they want.

## Push the questioning

Don't rush the user to sign off. After each round on the canvas, ask two or three pointed
questions, such as:

- Which of these two feels more like you, and why?
- What's on the board that you'd cut?
- What's missing that you'd expect to see?
- Is anything here only on the board because it looks good, rather than because it fits
  the brand?

Make the changes on the canvas, publish it again, and ask again. The board gets sharper with
every round, and the user's answers are the direction.

## Style guide: the brand, live

Once the direction is settled (Branch A) or the tokens are reconciled (Branch B), render the
style guide on the same canvas, one artboard per section, following the parts and rules in
[brand-teardown.md](brand-teardown.md): live swatches with measured contrast, type at true
size, the real logo on its grounds, spacing, radius, shadow, motion, imagery and voice.
Every specimen is labelled with its value and use; anything uncertain carries the
`unverified` tag.

## From style guide to system

The canvas is the approval gate. Corrections go token by token: **section, value, fix**.
Apply them, publish again, and ask again. Only when the user says the style guide is right
does the skill generate the `design-system/` folder, with every value exactly as the canvas
shows it. **Silence is not approval, and nothing is written before the user says yes.**

Put the canvas link in the design system's `context.md`, so the next session finds the
living style guide.

## When there's no canvas

If `/design` isn't available in the session, say so once and fall back to the brand
teardown page in [brand-teardown.md](brand-teardown.md): the same style guide as one HTML
page. The references and site breakdown then go in chat as links and short notes.
