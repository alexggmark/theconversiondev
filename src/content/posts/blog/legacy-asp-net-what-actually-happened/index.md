---
title: 'Modernising a legacy ASP.NET frontend: what actually happened'
pubDate: '2026-10-07'
description: "I wrote an optimistic post about modernising a decade-old ASP.NET eCommerce site with Alpine and Tailwind. Ten months later, here's what really happened."
tags: ["web"]
---

About ten months ago I wrote a cheerful little post about modernising a decade-old ASP.NET eCommerce platform with Alpine.js and Tailwind. I called the stack *"TALA"*, posted a Pines UI drawer, and said things like <mark>"a genuine no brainer"</mark>.

I've since taken that post down. Not because it was wrong exactly, but because it was written by someone who hadn't started yet.

This is the follow-up. The site now looks like the new designs, and I'm proud of that. But the route there looked nothing like the plan, and most of the big obstacles were things I had no way of controlling from where I sat.

## The setup (what I knew, and what I didn't)

The platform is a custom .NET eCommerce site for an aesthetics brand. It sells B2B and B2C products, offers, training courses and webinars, and it operates under strict UK regulations: who can buy what, at what price, with what credentials. That's the reason it was never on Shopify. None of it fits neatly into an off-the-shelf platform or CRM.

What I had going in:

- A **~10-year-old ASP.NET MVC 5 frontend** on .NET Framework 4.7.2
- A set of new designs, prototyped by me in Tailwind
- A plan: build a clean `v2` layout alongside the old one and port pages across one at a time

What I *thought* I understood, but didn't really:

- **The frontend is a shell.** Orders, pricing, offers, roles, product visibility: all of it lives in a separate backend API owned by another team. I could see that API only through a Swagger page they'd generated for me.
- **That team had no spare capacity.** They were 100% focused on migrating the business off an old custom CRM and onto a new ERP. That's a huge, business-critical job, and it was always going to take priority over a frontend refresh. Realistically, I was on my own.

I'd actually written all of this down in a planning doc early on. Under "Option 1: update the existing frontend" I'd estimated:

| Difficulty | Cost | Time |
|---|---|---|
| 2/5 | 1/5 | 2–3 months |

The plan assumed I'd get read-only backend access, a proper dev environment with a database snapshot, and a backend migration that kept the existing data contracts stable. I got the third one, mostly by default, because the API wasn't changing for anyone.

## What 10 years of Razor actually looks like

The figures from my old post ("some files stretched to 5,000+ lines") massively undersold it. Here's the codebase in raw numbers:

| Thing | Count |
|---|---|
| `.cshtml` views | 729 files, **~547,000 lines** |
| Distinct backend API routes referenced | ~1,026 |
| `id="…"` attributes in views | **23,962** |
| Inline `onclick=` handlers | 4,044 |
| Inline `style="…"` | 9,586 |
| `<script>` tags inside views | 2,756 |
| `.modal('show'/'hide')` calls | ~1,078 |
| `!important` in the SCSS | 1,153 |
| Lines in the main custom stylesheet | 13,011 |
| Hand-listed files in the `.csproj` | 3,274 |

Add jQuery 2.2.4 (plus a stray copy of 1.12.4), Bootstrap 4.1.3, 726 Kendo UI widgets, and a 1,898-line master layout.

The number that matters most is the IDs. They aren't styling hooks. **The markup is the API** between Razor, inline jQuery, Kendo and the shape of the backend responses. Rename a `<div>` on one page and you might break a feature on a page you've never opened.

## Attempt #1: the clean rewrite (abandoned)

The original plan was the one I described in the first post: a parallel `Views/Shared/v2/_Layout.cshtml`, Tailwind and Alpine, new JSON controller actions, and pages ported over from my prototype.

It lasted about two months. I rebuilt the layout, the nav, the banners and the product page, and cloned the basket into a lightweight Alpine store. Then I stopped. A few problems added up:

**1. The data contract couldn't move.** One commit message from that period reads *"Replacing .NET banner logic with new Alpine, will eventually update models"*. "Eventually" depended on the backend team, and it was never going to happen. So rebuilding the basket in Alpine didn't mean *improving* it. It meant cloning the existing jQuery behaviour, quirks included, because the API underneath was fixed. Every feature now existed twice.

**2. A parallel layout doubles the surface area.** Every fix had to land in v1 *and* v2. And because it's an old-style `.csproj`, every new file had to be registered by hand in Visual Studio 2019. Forget one, and it works perfectly on localhost, then silently isn't published. (Real commit: *"Manually recreating v2 files in VS19 so they're added to csproj"*.)

**3. Alpine meant rewriting too much jQuery.** This was the big one. Alpine is lovely when you own the state. Here, the state was spread across thousands of jQuery handlers, Kendo widgets and AJAX callbacks that all read and write the DOM directly. Making Alpine the source of truth meant rewriting all of them. On top of that, MVC 5 won't bind JSON request bodies for these actions (a modern `fetch` with `application/json` arrives as a null model), so I needed glue code everywhere.

**4. Two utility systems fighting.** The prototype was Tailwind. The site was Bootstrap 4 plus 1,153 `!important`s. You can guess who wins that one.

So in April I branched off into what I called the "alternate approach".

## Attempt #2: whittle v1 down

The new rule was simple and I wrote it at the top of my notes:

> **Change look, never behaviour.** Preserve every `id`, `name`, `class` used as a JS hook, every `onclick`, and the DOM structure JS reads.

Restyle in place. Never move the walls. And where possible, fix whole *categories* of bugs with one global layer instead of touching hundreds of call sites.

Alpine survived, but only where it's genuinely the right tool: the mobile filter drawer, the header, the cart counter, search. Seven `x-data` attributes across 729 views. That's a long way from "TALA", but it's honest.

### One file instead of 1,078 edits

Bootstrap 4.1.3 stacks modals badly. The second modal's backdrop ends up behind the first, and closing one modal removes the body scroll-lock even if another is still open. On top of that, the basket was a custom overlay with its own scrim, so opening a modal from the basket gave you double scrims, leftover scrims, or modals hidden behind the basket.

There are roughly 1,078 `.modal()` calls across 93 views. I wasn't touching those. Instead I wrote a small coordinator that listens to Bootstrap's own events:

```js
var BASE_Z = 1110;   // above the basket overlay (1100) and its scrim (1090)
var STEP = 20;

$(doc)
  .on('show.bs.modal', '.modal', function () {
      modalCount++;
      var z = BASE_Z + (modalCount - 1) * STEP;
      $(this).css('z-index', z);
      win.setTimeout(function () {
          $('.modal-backdrop').not('.' + BACKDROP_FLAG)
              .css('z-index', z - 1)
              .addClass(BACKDROP_FLAG);
      }, 0);
      syncBasketScrim();
  })
  .on('hidden.bs.modal', '.modal', function () {
      modalCount = Math.max(0, modalCount - 1);
      if (modalCount > 0) $('body').addClass('modal-open');   // BS4 drops scroll-lock otherwise
      else $('.modal-backdrop').remove();                      // sweep orphaned backdrops
      syncBasketScrim();
  });
```

The basket registers itself as a layer, and scrim visibility is *derived* from the state rather than toggled. That makes double or leftover scrims structurally impossible.

It isn't clean. There's a global `window.wmCloseBasketAfterApply` flag in there, because a shared async function has no success callback and adding one meant editing shared legacy code. I know the proper fix (make the basket a real Bootstrap modal). I chose not to do it.

The commit history from that day is a fair summary of how this felt: *"New modal system"* → *"Fix scrim error"* → *"New modal scrim control"* → *"Fix scrim error 2"* → *"Add fix to close scrim"*. And, also from that day: <mark>*"Giving up, hard fix"*</mark>.

### Same trick, different problems

- **Toasts.** The old site had per-page success and error banners. Rather than edit every caller, I rewired the helper functions they already called (`ShowSuccessForBasket()` and friends) to fire a single global `wmToast()`. Zero call sites changed.
- **`:has()` as a scalpel.** About a dozen FAQ, legal and account pages used the same Bootstrap sidebar layout. One selector turned all of them into a CSS grid, old markup and new:

```scss
.row:has(> .index) {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0.75rem;
    margin-left: 0;
    margin-right: 0;
}
```

- **Opt-in classes with "bridge selectors".** `.nav-tabs` is used on ~23 views with different designs, so a global restyle was off the table. A new `.wm-tabs` class, plus a couple of selectors bridging pages I'd already restyled, kept everything working without editing another nine views.

### The page-rebuild ritual

For account pages (orders, patients, notifications, addresses, users) I ended up with a 10-step checklist, and a strict definition of "done": loaded the page, checked desktop and mobile, and *every interactive control still works*.

That last part is what costs the time. One example: the order pages build each row as a giant jQuery string template. One file had seven near-identical ones. While converting them I found this, in live code:

```js
html += '<div class="row">' +
        '<div class="col">' + item.Name +
        '</div>'               // ← no trailing +
        '</div>';
```

No trailing `+`, so automatic semicolon insertion ends the statement early. The remaining closing tags become a dead expression and the browser closes the tags wherever it feels like. It was in two files and had been breaking the Cancelled tab for real customers for who knows how long. `node --check` doesn't catch it, because the JS is valid. I ended up counting `<div` vs `</div` per function with `awk`, which then turned out to be off by one because some closers were written as `'</div >'`. (About 20 minutes I won't get back.)

### Bugs I found and deliberately didn't fix

The hardest discipline was leaving things alone. If it was behaviour, not styling, it wasn't mine to change, because I couldn't fully test it without the backend.

- Pagination on one page called a function copy-pasted from the booking page, targeting an element that doesn't exist. Page clicks did nothing. Noted, not fixed.
- Some environment-specific behaviour is "configured" by commenting out the right line before deploy:

```js
// Use below for zeta and localhost
//var DOB = $("#Date").val() + "-" + $("#DBMonth").val() + "-" + $("#Year").val();

// Use below for beta and live
var DOB = $("#DBMonth").val() + "-" + $("#Date").val() + "-" + $("#Year").val();
```

- Image URLs with `https://localhost:44363/` baked into them. The admin form prepends the site URL for preview, then saves the full absolute URL back to the database. Anyone who ever edited a record locally stored `localhost` in production data. The real fix is a database update plus an admin change, neither of which I could make, so the frontend now strips the host before rendering. My commit history went from *"Localhost strip on banner images"* to *"Hardcore jQuery localhost url error override"* to *"turning off"*. A small saga.

## The speed wall

This is the part I couldn't win.

Users experience the site as slow, and the new design doesn't change that. So I measured first, and built a small diagnostics layer that adds a `Server-Timing` header to every response, splitting time spent in the backend API from time spent in our web code:

```csharp
response.Headers["Server-Timing"] = string.Format(
  "api;desc=\"Backend API\";dur={0}, ourcode;desc=\"Web code\";dur={1}, app;desc=\"Server total\";dur={2}, apicalls;desc=\"API calls\";dur={3}",
  apiMs, ourMs, serverMs, apiCount);
```

The results:

| Page | Time to first byte |
|---|---|
| Static asset | ~0.09s |
| Privacy policy (controller literally does `return View()`) | **~1.5s** |
| Homepage | ~1.8–1.9s |
| First hit after the app pool idles | ~4.5s |
| Product listing | **~5s** |

Locally, a blank page renders in 44ms and the full layout adds about 11ms. The web tier is fine. A near-static page costs 1.5s in production because every page makes several **synchronous, sequential** calls to the backend before it can render:

```csharp
var restResponse = restClient.Execute(restRequest);   // blocks the request thread
```

Nothing is async, so calls can't overlap. (The request timeout is set to 30 minutes, for the record.)

The useful outcome of all that measuring was being able to say, with numbers, that **migrating the web tier to .NET Core wouldn't help**. That's a valuable thing to know before someone funds it.

What I *could* do from my side:

- **Kill duplicate calls.** The same category list was fetched three times per page: cached-but-unused in the layout, uncached in the nav and homepage. A caching helper already existed and was being bypassed.
- **Cache the homepage**, so a warm homepage now makes zero backend calls.
- **Convert images to WebP**: 548 images, 155MB → 16.5MB, about 89% lighter.
- **Add instant.page** for hover-prefetching. That's an honest band-aid: it hides the 1.5s for anyone who hovers before clicking.

My own note at the start said *"caching should be a last-minute thing, we need more foundational fixes first."* But the foundational fixes (async calls, IIS warm-up config, the 60-product query behind the listing page) all live on the other side of the wall. Caching is what's left.

## What "modernised" ended up meaning

| Wanted | Got |
|---|---|
| New design across the site | **Yes.** Homepage, nav, listings, product pages, basket, checkout, account pages, offers, training, legal |
| Component-based Tailwind/Alpine frontend | **No.** SCSS ports of the prototype layered over Bootstrap. Alpine in 7 places |
| A faster site | **Partly.** Lighter images, cached homepage, perceived speed via prefetch. The 1.5s floor is backend-bound |
| Clean data contracts | **No.** Untyped `dynamic` responses all the way up |
| Delete the dead code | **Mostly no.** Too risky to prove anything unused without seeing the backend |
| 2–3 months | **About 4 months of build**, with a full change of direction halfway through |

## What I'd tell myself ten months ago

**"Modernise" can quietly mean "reskin".** If you can't change the data layer, you're doing a reskin. That's fine, and it can still be a big improvement, but scope it and call it that from day one. Mine only became honest after two months.

**Find out who owns the data contract before choosing a stack.** Alpine and Tailwind weren't wrong. They were the wrong *strategy* for a frontend whose state belongs to someone else. Ask what you're allowed to change before you ask what you'd like to use.

**Instrument before you argue.** "The backend is slow" is an opinion. A `Server-Timing` header showing 1,450ms of API time on a privacy policy page is a fact, and it holds up in any meeting.

**Prefer additive global layers over call-site edits.** One coordinator file, one rewired helper, one `:has()` selector. In a codebase where the markup is the API, the fewer places you touch, the fewer things you break.

**Write the playbook down.** My notes file (rules, gotchas, checklists, "grep the controller's `return View()` first, because the obviously named partial is dead") saved me more time than any library did.

**Some walls aren't yours to move.** The backend team weren't being difficult. They were doing a bigger, more important migration with the people they had. The constraint was structural, and recognising that sooner would have saved me two months of building against it.

For the record, I still think Alpine and Tailwind is a lovely stack. I'll use it properly one day, on a project where I own the data.
