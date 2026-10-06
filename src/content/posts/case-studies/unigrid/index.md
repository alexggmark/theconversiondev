---
title: 'Grid-based Shopify Page Editor'
pubDate: '2026-10-04'
tags: ['case-study']
result: 'TOOL'
---

I designed and built unigrid. It's a Shopify app that lets merchants build their store's pages by dragging and resizing blocks on a fixed grid, plus the custom Shopify theme those pages are published to.

::video{src="/assets/unigrid-4-1.mp4" poster="/assets/unigrid-4-1-poster.jpg"}

It's still WIP, but it's pretty damn close to the editor I've wanted on every Shopify store I've worked on.

You edit the real page, <mark>every block stays exactly where you put it</mark> (on desktop or mobile), any page layout can be <mark>A/B tested without flicker</mark>, and everything is saved to Shopify metaobjects.

*Hydrogen · React Router 7 · TypeScript · Cloudflare Workers · dnd-kit · Shopify Admin & Storefront APIs*

***

## The Problem with Theme Editors

I've built more than 20 Shopify stores as a CRO and growth engineer, and what's always disappointed me is that Shopify has never really had a WYSIWYG editor.

Horizon is a real step up from Dawn. You can build things with it that used to need a developer. But you still can't pick up a block on the page and move it, or grab its edge and make it bigger…

It also gives merchants a lot of the wrong thing: a long list of block types (many of them variations on each other), and a bunch of layout sliders on every section with nothing tying them together. I think a few well-considered blocks on a strong design system would do more, especially if merchants could easily change that system themselves.

This project actually started as a Horizon build. About 30% of the way in I got bored of working around it and decided the more interesting thing was to build the editor I'd wanted all along.

***

## Free and Fixed

The idea is **free and fixed**. Drag and resize any block on the page itself. Push gutters, padding and rounding as far as you like, but they're set once for the whole theme and measured in one unit on one grid, so the page holds together.

The name comes from Massimo Vignelli, a designer I really like. "Unigrid" was his system for the US National Park Service: a handful of standard formats sharing one modular grid, with every park brochure composed on it. Hundreds of publications, one system, and none of them look the same.

That's the part I like. A grid doesn't limit what you can make, it makes everything you make fit together.

***

## What It Does

- Pages are laid out by dragging blocks (text, images, products, collections, menus, cart and so on) onto a fixed grid.
- There are three breakpoints: desktop (12 columns), tablet (8) and mobile (4). Tablet and mobile are worked out from desktop, and any block can be placed by hand at either.
- It covers home, generic pages, product and collection. Product and collection each use one template for the whole catalogue.
- Changes save to a draft and go live on publish. Theme colours and spacing are set once and apply everywhere.
- Any page can run an A/B test, with version B built in the same editor and picked on the server.

There are two ways in: an embedded Shopify admin app, which is the real editor and saves to the store, and a public playground running the same editor in memory.

***

## One Scalar

Within a breakpoint the layout doesn't reflow, it zooms. The whole page scales with the grid's width, driven by one value:

```css
.u-grid {
  --u: 1cqw;                                   /* 1% of the grid's own width */
  --gutter: calc(var(--u) * var(--gutter-u, 1.5));
  --col: calc((100cqw - (var(--cols) - 1) * var(--gutter)) / var(--cols));
  --row: calc(var(--col) * 0.75);              /* cells keep one shape */
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  grid-auto-rows: var(--row);
}
```

Gutters, type, padding and corner radii are all multiples of `--u`, and there are no pixel values in the grid. Because `--u` is based on the grid's own width rather than the window, the editor can preview a phone just by narrowing the canvas. Theme settings are stored as multiples of `--u` too, so a merchant's gutter scales with everything else.

***

## The Layout Engine

Most of the work (and nearly all of the mistakes) went into the layout engine. It had to stop you breaking a page, and still do exactly what you dragged. Getting both took a lot longer than I expected.

The engine is about 1,500 lines of TypeScript with no dependencies, and lint rules that stop it importing React, Shopify, the router or the DOM. I built and tested it before anything was draggable.

### The Model

A block is a box with a size and some content. Its type decides what it renders and nothing else, so every block follows the same placement rules.

```ts
type Cell = {col: number; colSpan: number; row: number; rowSpan: number};

// presence is the override flag, so a derived placement can never go stale
type Placement = {a: Cell} & Partial<Record<'b' | 'c', Cell>>;
```

Desktop (`a`) is always set. If tablet (`b`) or mobile (`c`) has a cell, the block was placed by hand at that breakpoint, and if not, its position is worked out. There's no separate "overridden" flag that could get out of sync, and resetting a block just deletes its cell.

### Every Edit Is Checked First

Every move is checked before it's applied, and the check returns either the new layout or the reason it was refused:

```ts
type Invalid =
  | {ok: false; reason: 'out-of-bounds'}
  | {ok: false; reason: 'bad-span'}
  | {ok: false; reason: 'overlap'; with: string}
  | {ok: false; reason: 'no-such-block'};

function place(layout, id, band, cell): {ok: true; value: Layout} | Invalid
```

The main rule is that **no edit moves a block other than the one you're editing.** A drop that would overlap something or fall off the grid is refused, never fixed by shoving a neighbour aside.

The one exception is **add row**, which moves everything below a line down together, because that's what you asked for. Duplicate uses it too, opening up empty rows below the original so the copy can't land on anything.

```ts
// a block crossing the line stays put, so no span changes and nothing can land on anything else
export const insertRow = (layout: Layout, row: number, count = 1): Layout => ({
  ...layout,
  blocks: layout.blocks.map((b) =>
    b.at.a.row >= row ? {...b, at: {...b.at, a: {...b.at.a, row: b.at.a.row + count}}} : b,
  ),
});
```

Every engine function returns a new layout rather than changing the old one, so undo is just a list of past layouts to step back through.

***

## The Part I Got Wrong

For the first four phases the engine did something cleverer than cutting content off. It measured text in the browser and grew a block when its copy didn't fit, pushing down whatever was below. I thought it was the best of both: a strict grid that still made room for real content.

In practice it fought me the whole way. First, a block got a row taller every time I edited anything. The browser reports heights in whole pixels but grid rows aren't whole pixels, so a block that fitted exactly could measure a pixel too tall, round up to an extra row, and then measure that taller box on the next edit. Then I found the editor was saving the grown size as if the merchant had chosen it. Each fix worked, and each one turned up the next problem.

What finally ended it was the masthead. Its heading needed three rows but was set to two, so it had grown by one. Dragging its bottom edge up did nothing to it and moved everything underneath instead. Sliding it two columns sideways pushed an unrelated block down, just because they now shared a column.

All of that was what the spec said should happen. None of it made sense to someone looking at what they'd just dragged, and I came to think that's the test an editor has to pass.

So I deleted it. Blocks are now exactly the size you set, anything extra is cut off, and the editor flags blocks that are cutting content. The deletion was bigger than the feature had been: the measuring, the resolver, the overlay for pushed blocks mid-drag, and a split between "set size" and "shown size" that ran through the whole editor. It also removed the only place a block's type changed how it was placed, so a text block now behaves like every other block.

***

## Working Out Smaller Screens

Tablet and mobile are worked out from the desktop reading order (row, then column), laid into a fixed number of tracks:

```ts
export const COLUMNS = {a: 12, b: 8, c: 4};
export const TRACKS  = {a: 1,  b: 2, c: 1};   // tablet pairs up, mobile stacks
```

Blocks wider than half the desktop grid stay full width. Everything else goes into whichever track has room highest up. A block placed by hand only takes up its own columns, so pinning one on mobile doesn't leave dead space beside it:

```ts
// step past anything hand-placed in these columns rather than reserve the whole row for it
const settle = (col: number, from: number): number => {
  let row = from;
  for (;;) {
    const clash = fixed.find((f) => overlaps({col, colSpan, row, rowSpan}, f));
    if (!clash) return row;
    row = clash.row + clash.rowSpan;
  }
};
```

This took two goes. The first version stacked everything full width on both tablet and mobile, so tablet was really just mobile, bigger. I considered shrinking desktop sizes by 8/12 instead, but that means rounding to whole columns and then fixing the overlaps the rounding causes (and 3 columns of 12 doesn't look the same as 2 of 8, even though it's the same proportion). Two side by side is simpler to build and simpler to explain.

***

## Architecture

```
core/        grid maths, block model, derivation, serialisation, undo
             zero dependencies: no React, no Shopify, no DOM
blocks/      block renderers and the grid CSS, shared by both apps
editor/      the editing UI: drag (dnd-kit), selection, inspector
storefront/  Hydrogen on Cloudflare Workers. Read only.
admin-app/   embedded Shopify app. The only thing that writes.
```

**One grid everywhere.** The storefront and admin app have to render the same grid, so the blocks live in a shared package. The admin app isn't a Hydrogen app, so Hydrogen's `<Image>` and links are passed in by whichever app is hosting them, with plain HTML as the fallback:

```tsx
const Ctx = createContext<ImageRender>(Img);       // plain <img> by default

// storefront: a thin wrapper over Hydrogen's <Image>
<Grid image={StoreImage} link={StoreLink}>…</Grid>
```

**The storefront can't write.** A save route on the storefront would have been a public, unauthenticated way to change the store. Instead the editor runs in two shells, and the difference is one optional prop:

```tsx
<Editor initial={playground} />                        // public: no save button, no save path
<Editor initial={fromStore} onSave={saveDraft} />      // admin app
```

The playground can't save because it isn't given anything to save with.

**No iframe.** Theme editors usually show the store in an iframe, and dragging from a sidebar into an iframe is awkward. The editor renders the real blocks on the same page instead.

**Cloudflare, not Oxygen.** Shopify's own host only gives you a public URL on a paid plan. It runs on the same runtime as Cloudflare Workers, so moving was mostly a deploy change. I ruled out Vercel because it lacks the caching API Hydrogen uses for Shopify queries.

***

## Saving to Shopify

Layouts are stored in Shopify metaobjects, written by the admin app and read by the storefront. Shopify caps JSON fields at 128KB, so the saved format uses short keys, leaves out defaults, and doesn't store anything that can be worked out:

```
{v, b:[block]}
block = {i, a:cell, b?:cell, c?:cell, f?:fill, k?:[node]}
cell  = [col, row] | [col, row, colSpan] | [col, row, colSpan, rowSpan]
```

An empty block saves as `{"i":"x","a":[1,1]}`, and a realistic homepage comes out at 10–22KB.

- **Blocks store references, not data.** A product block holds a product handle. On the product template, "whichever product this page is for" is saved as nothing at all, so a template can't get stuck on the product it was previewed with.
- **Draft and published are separate.** Publish copies the *saved* draft, not what's on screen, so unsaved edits can't go live.
- **Colours are palette slots, not hex values.** Changing a theme colour recolours every page without touching a layout.

***

## Testing the Engine

The engine is tested with Vitest, in plain Node, with no browser and no Shopify. That's only possible because `core/` has no dependencies: every function takes a layout and returns a new one, so a test can call it directly.

The test I value most generates 25,000 random, crowded layouts and checks that <mark>no two blocks overlap at any breakpoint</mark>. There's no property-testing library behind it, just a small random number generator that takes a seed. Each layout is 4 to 18 blocks packed tightly on the desktop grid, because crowded layouts are where working out tablet and mobile is most likely to put two blocks on top of each other:

```ts
for (let seed = 0; seed < 25_000; seed++) {
  const r = rng(seed);                           // same seed, same layout, every run
  const layout = densePacked(r, int(r, 4, 18));  // 4–18 blocks, packed tight

  for (const band of BANDS) {
    const cells = [...derive(layout, band).values()];
    for (let i = 0; i < cells.length; i++)
      for (let j = i + 1; j < cells.length; j++)
        if (overlaps(cells[i], cells[j])) throw new Error(`seed ${seed} band ${band}`);
  }
}
```

That's over 750,000 positions checked per run, and it takes under half a second. The seed is the useful part: if it ever fails, the error names the exact seed and breakpoint, and that one layout can be rebuilt and debugged on its own. The test also checks that each generated desktop layout is clean before working anything out from it, otherwise a bug in the generator could pass for a bug in the engine, or hide one.

Smaller tests check that drops land on whole cells, saving and loading loses nothing, undo then redo gets back the same state, and an edit changes only the block being edited.

The save and publish code only depends on the few Shopify methods it actually calls, so a small fake stands in for Shopify and the whole write path is tested without a network. Playwright takes a screenshot at each breakpoint and fails if the grid changes.

***

## A/B Testing

On every store I've worked on, A/B tests ran in a separate tool that loads after the page and rewrites it in the browser. That means flicker, and a second place to build the variant, away from the page it's testing. So I built PostHog feature flags (my favourite tool) right into the editor.

### Whole Pages, Not Blocks

Hiding a block per variant seemed obvious, but the engine never closes gaps, so a hidden block just leaves a hole. Moving blocks per variant would mean checking every variant for overlaps at every breakpoint.

So a variant is a whole layout for one page. That's already what the merchant builds, B gets its own tablet and mobile layouts the same way A does, and the engine doesn't need to know a test is running. I kept it to two versions, since most stores struggle to fill two with traffic, let alone three.

### PostHog Owns the Split, Shopify Owns the Content

The merchant enters a PostHog flag key. PostHog already handles the split, pausing and rollout, so storing any of that in Shopify would mean two places that could disagree. The page's metaobject only stores the content and which flag to use:

```
draft, published          A, as before
draft_b, published_b      B
flag                      the PostHog flag key
```

A test only runs when B is published, a flag is set and the flag is on in PostHog. Otherwise everyone sees A, which also covers a mistyped key.

### No Flicker, Because the Browser Never Decides

Here the choice is made on Cloudflare before the page is built, so the browser only ever gets one version. Hydrogen's server code is the Cloudflare worker, and the page's loader asks which version this visitor gets before anything renders:

```ts
const flag = region.fields.find((f) => f.key === 'flag')?.value;
const b = layoutFrom(region, 'published_b');
if (!b || !isFlag(flag)) return {body: a};

const {arm, counted} = await ab.arm(flag);
```

A cookie remembers the answer, so PostHog is only asked on a visitor's first view, and it gets 300ms to reply. If it's slow, the visitor sees A and isn't counted, so a slow PostHog can't slow the page or skew the results. Flagged pages aren't cached, and `?ug_arm=b` previews either version without being counted.

What keeps it flicker-free is that no component reads the flag. Components run again in the browser, so a flag read inside one would be decided there too.

### In the Editor

The sidebar gets an A/B section: create a test (B starts as a copy of A), toggle between versions, and enter the flag key. Each version keeps its own undo history, and publish puts both live together. The test ends with **Roll out** on the winner, which ships the version that was *tested*, not anything changed since. It's the one thing undo can't reverse, so it asks first.

Still to build: sending exposure events from the browser, and linking orders to a version through a cart attribute.

***

## Known Limits

Type is sized relative to the grid, so it doesn't respond to browser zoom or a user's font-size setting. That fails WCAG 1.4.4, and I've accepted it for now. Because every size comes from `--u`, I expect the fix to be one `clamp()` with a minimum size, not a change to the layout.

***

## Key Learnings

<mark>Use it by hand as early as possible.</mark> I moved an interactive prototype ahead of saving to Shopify, so a wrong model would be cheap to change. Growth passed every test I wrote for it, and it took dragging a real masthead to see it was wrong.

<mark>Not every rule in a spec matters equally.</mark> Early on I wrote keyboard-only editing into the spec in the same list as "no two blocks overlap". I didn't test it for three weeks and didn't miss it, which suggested it was never really a requirement. In a list, they looked the same.

<mark>Make broken states hard to create.</mark> Bad drops are refused rather than undone. A hand-placed block is one with a cell, not one with a flag beside it. The mobile column count for a collection has to divide the desktop count, so the control only offers numbers that do.

<mark>Every edit should make sense when it happens.</mark> That came out of the growth mess, and it's why nothing moves except the block you grabbed.

unigrid ended up as a layout engine first and an editor second. Because a layout is just checked data, it can be saved, previewed and tested against another version without much risk of breaking anything.
