# satsuma.works: the studio and the tree

Spec for the November 2026 rebuild. Written 2026-10-31 after a grilling
session. Copy below is a draft for Andrew's review; nothing here is built yet.

Companion spec: `~/Dev/Personal/andlum.github.io/docs/spec-2026-11-rebrand.md`.

## Goal

Turn the one-line landing page into the public face of Studio Satsuma: a
portfolio of small apps, shown as fruit on a satsuma tree, with a soft offer
of client work. The studio is the name on the app stores, so this site is
what an app user finds. It must stand on its own without naming Andrew.

**Primary reader:** people who'd use the apps. **Second reader:** a recruiter
who followed the link from andlum.com and wants to see shipped work.
**Third reader:** a founder who shipped a prototype with AI and now needs it
to scale.

## Decisions (from the grilling session)

| Topic | Decision |
|---|---|
| What Satsuma is | A personal studio that might take client work. Satsuma LLC. |
| Voice | Studio "we." The site never names Andrew. andlum.com links here; nothing links back. |
| Services | One sentence aimed at founders who've outgrown a prototype, plus hello@satsuma.works. No services page. |
| Roster | Every project appears, with a status. Unreleased ones get a name and one line, no page. |
| Statuses | Live, In progress, Coming soon. Shown on the tree as ripe fruit, green fruit, blossom. |
| Kata | Live app, name not final. Project page scaffolded with placeholders, `draft: true`, never built. |
| The tree | Interactive SVG. Grows once per visitor, then stays grown. Ripe fruit can be picked (hold and drag) to open a card. |
| Design language | Keep cream, tangerine, mint, Instrument Serif and Sans. Flat vector illustration extending the favicon. |
| Stack | Move to Eleventy 3, mirroring andlum.github.io. One markdown file per project. |
| Analytics | Keep Cloudflare Web Analytics. |

## Homepage copy (for review)

---

**Studio Satsuma**

*Small apps, grown in Brooklyn.*
(alternatives: "A small studio growing useful things." / "Useful things, grown slowly.")

[the tree]

Pick a ripe one.

**Projects** *(plain list, always rendered)*
- **Kata** · Live · A workout log for the multisport athlete. [placeholder]
- **Practice** · Live · [one line]
- **Locals Only** · In progress · [one line]

Shipped a prototype with AI and hit the wall? We make it scale, and help you
build the team that keeps it that way. [hello@satsuma.works](mailto:hello@satsuma.works)

Satsuma LLC · Made with ♥ in Brooklyn

---

Notes on the copy:

- The old tagline ("Crafting delightful digital experiences in New York
  City") promised an agency. The new one describes a studio with products.
- "Pick a ripe one" is the only instruction the tree gets. It's also the
  tooltip on green fruit and blossoms ("Not ripe yet").
- The project list under the tree is not a fallback hidden behind a media
  query. It is always visible, styled as a real list, and is what search
  engines, screen readers, and no-JS visitors get.
- Status words in the list and cards are plain English. The fruit carries the
  metaphor; the words don't need to.
- Meta description: "Studio Satsuma is a small studio in Brooklyn making
  small, useful apps. Also available to help founders scale what they've
  built."

## Roster

Facts to fill before build. Names in brackets are placeholders.

| Project | Status | Fruit | Platform | Links | One line | Page |
|---|---|---|---|---|---|---|
| Kata [name TBD] | Live | Ripe | [iOS / web] | [App Store / web URL] | A workout log and routine library for the multisport athlete, with an MCP connection so your assistant can read your training and write your routines. | Drafted, hidden |
| Practice | Live | Ripe | [ ] | [ ] | [ ] | Yes, once copy exists |
| Locals Only | In progress | Green | [ ] | none yet | [ ] | No |

Add a row per future project. Coming-soon projects are blossoms with a name
and nothing else.

Socials: none for the studio today. A per-project social may exist for Kata
later; the card supports an optional `links` list so this needs no redesign.

## Project pages

For live projects only. URL `/projects/<slug>/`. Same layout as the homepage
(cream, narrow column, serif headings). Sections, in order:

1. **Name and one line.** The same one line as the roster.
2. **Who it's for.** Two or three sentences on the person and the problem.
3. **What it does.** Three to five short bullets.
4. **The interesting bit.** One paragraph on the thing a builder would want
   to know. For Kata: the MCP server, what the assistant can read and write,
   and why a training log is a good fit for that.
5. **Status and links.** Status word, store badges or web link, date first
   shipped.
6. **Screenshots.** Optional, one to three, phone-framed.

Front matter:

```yaml
---
title: Kata
slug: kata
status: live          # live | in-progress | coming-soon
oneLine: A workout log and routine library for the multisport athlete.
platform: [ios]
links:
  - label: App Store
    url: https://apps.apple.com/...
slot: 3               # which fruit position on the tree, see below
icon: /img/projects/kata.svg   # optional
draft: true           # excluded from build and collections
---
```

### Kata scaffold

`src/projects/kata.md` with `draft: true` and every section present as a
labeled placeholder (`[WHO IT'S FOR: ...]`). The file is in the repo and
never built. When the name is settled: rename the file and `title`, fill the
placeholders, flip `draft` to `false`.

## The tree

### Composition

- Inline SVG, portrait, viewBox roughly 4:5. Max width 640px on desktop,
  full width on phones. Sits between the tagline and the hint line.
- Flat vector, soft shapes, no outlines. Palette from the existing page and
  favicon, as CSS custom properties:
  - cream `#FFF6E9` (ground and background)
  - tangerine `#E06A16` (ripe fruit)
  - mint `#B7E4C7` (leaf highlight, from the favicon)
  - two leaf greens (one deeper than mint) for the canopy
  - unripe green for in-progress fruit (between the leaf greens)
  - white with a cream shadow for blossoms
  - warm brown for trunk and branches
- One trunk, four or five branches, a rounded canopy of overlapping leaf
  blobs, a soft ground line. The emoji watermark goes; the tree is the
  illustration now.

### Fruit slots

The canopy has twelve named anchor points (`slot: 1` through `slot: 12`),
spread so any subset reads as balanced. Each project declares its `slot` in
front matter. Positions therefore never reshuffle: a new project grows in a
new spot, and the tree looks the same on every visit. The build fails if two
projects claim one slot.

Fruit by status:
- **Live:** ripe satsuma, tangerine, small leaf at the stem. Pickable.
- **In progress:** smaller green fruit. Not pickable; wobbles on touch with a
  label "Locals Only · in progress · not ripe yet".
- **Coming soon:** white blossom. Not pickable; same wobble and label.

### Growth

- First visit: the tree grows over about 2.5 seconds. Ground line draws,
  trunk rises, branches extend, leaves scale in from their stems, fruit pops
  in last, ripe ones with a tiny bounce. Driven by CSS animations on SVG
  groups (transform origins at the base of each part) and
  `stroke-dashoffset` for the trunk and branches. No library.
- After growth, `localStorage['satsuma:grown'] = '1'`. On any later visit the
  tree renders fully grown with no animation. The key is wrapped in try/catch
  so private windows still work (they just see it grow again).
- `prefers-reduced-motion: reduce` renders fully grown, always, and disables
  sway, wobble, and the pick animation. Picking still works as an instant
  open.
- Clicking the trunk replays growth. Small, unadvertised.

### Picking

Ripe fruit only. State machine per fruit:

| State | Enter when | Looks like |
|---|---|---|
| idle | default | gentle sway on hover (2px, 1.2s ease, loops while hovered) |
| pressed | pointerdown | nothing yet; timer starts |
| grabbed | pressed for 250ms | lifts 4px, gains a soft shadow, cursor `grabbing` |
| dragging | pointer moves while grabbed | fruit follows the pointer; stem stretches as a thin curve back to the branch |
| detached | drag distance passes 40px in any direction | stem snaps (short line flicks back to the branch), fruit eases down 24px, card opens |
| open | card visible | fruit rests just above the card; other fruit dimmed to 70% |
| returning | card closed, or pointerup before detach | fruit springs back to its slot over 300ms, stem redraws |

Rules:
- Release before 40px: returning. Release after: detached, card opens. No
  need to drag to a target.
- A plain click without hold does nothing on pointer devices except a small
  wobble, so accidental clicks don't open cards. Keyboard is different, below.
- One card open at a time. Opening a second fruit returns the first.
- Escape, clicking outside the card, or the card's close button closes it.
- Fruit elements set `touch-action: none` so the page doesn't scroll during
  a drag. The rest of the SVG scrolls normally.
- Pointer Events API throughout; one code path for mouse, touch, and pen.

### Cards

- Desktop: a small card anchored below the detached fruit, max 320px wide.
  Arrow pointing at the fruit.
- Phones (under 640px): a bottom sheet sliding up, same contents.
- Contents: project name, status, the one line, a second sentence if the
  project has one, then links as buttons (App Store, web, project page). The
  project page link is first for live projects with a page.
- Markup is a `<dialog>` or `role="dialog"` with `aria-labelledby` the
  project name. Focus moves into the card on open and back to the fruit on
  close.

### Keyboard and screen readers

- Each ripe fruit is a `<button>` inside the SVG via `<foreignObject>`, or a
  `<g role="button" tabindex="0">`, with `aria-label` "Kata, live. Pick to
  see details." Enter or Space opens the card directly; no hold needed.
- Green fruit and blossoms are `aria-hidden`; their information is in the
  plain list.
- The whole SVG has `role="img"` and `aria-label` "A satsuma tree with
  three fruit: two ripe, one still green." generated from the roster, with
  the interactive fruit exposed as described above.
- The plain list beneath the tree is the canonical accessible content.

### Data flow

Eleventy builds `projects` from `src/projects/*.md` (non-draft). A Nunjucks
template renders the SVG with one fruit `<g>` per project at its slot,
carrying `data-slug`, `data-status`, and the card contents in a hidden
`<template>` per project. `tree.js` (vanilla, under 6KB unminified) handles
growth, picking, and cards. No JSON fetch, no framework.

## Technical notes

- **Eleventy 3** mirroring andlum.github.io: `src/` input, `public/` output,
  `_includes`, `_data`, passthrough for `css`, `img`, `js`, `CNAME`,
  `.nojekyll`. Same `package.json` shape and content-hashed stylesheet.
- **Deploy:** GitHub Pages currently deploys from the `main` branch root.
  Switching to a build means a `build.yml` Actions workflow (copy from
  andlum.github.io) and an owner step: repo Settings → Pages → Source →
  GitHub Actions. The README's setup section is updated to match.
- **Fonts:** Instrument Serif and Instrument Sans stay, loaded as today.
- **Analytics:** Cloudflare beacon stays in the layout.
- **Favicon:** keep. The tree extends it, so they should look related.
- **Images:** `src/img/projects/<slug>.svg` for icons when they exist; the
  card and the plain list show them, the fruit does not.

## Open items

- [ ] Roster facts: one line, platform, links for Practice and Locals Only.
- [ ] Kata's final name.
- [ ] Tagline: "Small apps, grown in Brooklyn." or an alternative.
- [ ] App icons, if any exist.
- [ ] Which fruit slot each project takes (defaults: Kata 3, Practice 7, Locals Only 10).

## Build plan

Two sessions in this repo, in order. A third can start in parallel.

1. **Eleventy migration and content.** Scaffold Eleventy 3, port the current
   page into a layout, add the `projects` collection, project page layout,
   roster list, new copy, Kata draft scaffold, `build.yml`, README update.
   Ship with a static placeholder where the tree goes. Done: `npm run
   build` produces the site, project pages render, Kata does not, Pages
   deploys via Actions after the owner flips the source.
2. **The tree.** Build `tree.njk` and `tree.js` against the `projects`
   collection: composition, slots, growth, persistence, reduced motion,
   picking, cards, keyboard. Done: all three roster entries render as the
   right fruit, picking works with mouse, touch, and keyboard, the tree is
   grown on a second visit, and Lighthouse accessibility stays at 100.
3. **Tree prototype (optional, parallel with 1).** A single HTML file with
   three fake projects to settle the illustration and the gesture feel
   before session 2 wires it to real data.
