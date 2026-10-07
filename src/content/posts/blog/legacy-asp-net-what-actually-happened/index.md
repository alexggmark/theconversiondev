---
title: 'Modernising a legacy ASP.NET frontend: what actually happened'
pubDate: '2026-10-07'
description: "I wrote an optimistic post about modernising a decade-old ASP.NET eCommerce site with Alpine and Tailwind. Ten months later, here's what really happened."
tags: ["web"]
---

> **A quick note:** this project is under NDA, so I've anonymised the client and left out screenshots. The numbers, code snippets and commit messages are real.

About ten months ago I wrote a cheery little post about modernising a decade-old ASP.NET eCommerce platform with Alpine.js and Tailwind. I called the stack *"TALA"*, talked about how great Pines UI is, and used phrases like "a genuine no brainer".

I've since taken that post down, because <mark>I was wrong</mark>. Not slightly wrong, either. I was confidently, cheerfully wrong, in the way you can only be before you've actually started.

My favourite line from it: *"the actual ASP logic wasn't overly complex and worked fine. It just needed to look and feel better."*

Spoiler: it did not just need to look and feel better.

I was naive. I thought this was a frontend project with a nice stack attached. It turned out to be a project about ownership, scope and expectations, and the code (which was plenty hard) was the least of it.

Most of the real work happened in documents, meetings and scope conversations, and most of the obstacles were things no amount of code could fix.

## The setup

The platform is a custom .NET eCommerce site for an aesthetics brand. It sells B2B and B2C products, offers, training courses and webinars, and it operates under strict UK regulations: who can buy what, at what price, with which credentials. That's why it was never on Shopify. Very little of it fits neatly into an off-the-shelf platform or CRM.

It's also not a side project. <mark>Over £10m of trade</mark> passes through the site every year, much of it from professionals who reorder regularly and rely on it working. Breaking checkout for an afternoon isn't a funny anecdote here; it's real money and real customers' clinics. That shaped every decision that follows.

My role started as "developer and CRO person who'll modernise the frontend". It quickly became something broader, because of how the project was set up:

- **I was the only technical specialist on the project.** We had a project manager and a design team, but nobody else who could look at the codebase and say what something would cost.
- **The backend belongs to a separate team**, and their time was 100% committed to migrating the business off an old custom CRM onto a new ERP. That's a huge, business-critical job, and it rightly came first.
- **The new designs were ambitious**, and drawn for the platform the business wanted rather than the one it had.
- **The business wanted it done fast.** That's a reasonable thing for a business to want. It just meant someone had to keep explaining what "fast" could realistically cover.

So in practice, the job was three jobs: technical strategist, translator between design, leadership and the backend, and the person writing the code.

## Before any code: working out what we actually had

My ~~toxic trait~~ first instinct was "scrap it and rebuild in Next.js". I got the backend team to generate Swagger docs, mocked up a headless frontend, planned the auth middleware, and put together a presentation on headless architecture.

Then I did the less exciting thing and wrote an options paper. Three routes, roughly costed:

| Option | Difficulty | Cost | Time |
|---|---|---|---|
| 1. Update the existing ASP.NET frontend | 2/5 | 1/5 | 2–3 months |
| 2. New headless frontend (e.g. Next.js) on the existing backend | 5/5 | 1/5 | 6 months+ |
| 3. Off-the-shelf ERP/commerce platform | 1/5 | 5/5 | Unknown |

Option 1 had conditions attached, and I listed them as blockers in the paper:

- **Backend visibility.** Read-only access to the backend code and documentation, so we could understand *why* things broke or ran slowly.
- **A real dev environment.** Version control and a database snapshot, so changes could be tested against realistic data instead of deployed and eyeballed.
- **Stable data contracts.** The backend migration should keep existing endpoints and data shapes, so frontend work didn't have to wait for it.

A couple of months in, I followed that with a fuller platform review for leadership. The headline finding:

> The website is a frontend shell. Orders, pricing, offers, roles, product visibility, ERP sync: all the real business logic lives in a separate backend API that we can't see into.

That changed the conversation. A rebuild by an agency, a headless frontend and a platform migration all ran into the same wall. So the review asked three questions that I don't think had been formally asked before: *Who owns the backend code? What are our rights and SLAs if that relationship changes? And what exactly is the ERP migration changing in the API?* Its recommendation was to scope any rebuild as **frontend only, against the existing API**, because rewriting regulated business logic was a multi-year risk that nobody was resourced for.

I'm still proud of that document. It's probably the most useful thing I produced on the project, and there isn't a line of code in it.

## Fighting for scope

The answers to those questions all pointed the same way. With no backend capacity, headless was off the table, the dev environment I'd asked for never materialised, and backend access stayed at "here's a Swagger page".

That left Option 1, with none of its conditions met. From then on a big part of my week looked like this:

- **Translating designs into cost.** A redesigned component that looked like a small visual change might sit on top of 1,500 lines of inline jQuery and a backend response shape I couldn't change. My job was to explain that early, and offer something achievable instead.
- **Absorbing design changes.** When designs moved mid-build, I had to explain what that did to the timeline, every time.
- **Resetting expectations about speed.** "Can we make the site faster?" turned out to be mostly a backend question. I needed proof before I could say so in a meeting (more on that below).
- **Chasing the backend team** for access, answers and data fixes, knowing full well they had bigger fish to fry.

None of this is anyone being unreasonable. Designers design the ideal. Leadership wants results. The backend team had a migration to land. But as the only technical person in the room, I ended up being the one who kept saying "yes, but". I didn't always say it well, or early enough, and it's a strange kind of work that never shows up in a commit history.

## What 10 years of Razor actually looks like

To make the scope argument, I needed numbers. "Some files stretch to 5,000+ lines", as I put it in the original post, massively undersold it:

| Thing | Count |
|---|---|
| `.cshtml` views | 729 files, **~547,000 lines** |
| Distinct backend API routes referenced | ~1,026 |
| `id="…"` attributes in views | **23,962** |
| Inline `onclick=` handlers | 4,044 |
| `<script>` tags inside views | 2,756 |
| `.modal('show'/'hide')` calls | ~1,078 |
| `!important` in the SCSS | 1,153 |
| Hand-listed files in the `.csproj` | 3,274 |

The number that matters is the IDs. They aren't styling hooks. **The markup is the API** between Razor, inline jQuery, Kendo widgets and the backend's response shapes. Rename a `<div>` on one page and you might break a feature on a page you've never opened.

## Attempt #1: the clean rewrite

Even inside Option 1, I tried to keep a path open to something modern: a parallel `v2` layout in Tailwind and Alpine, new JSON endpoints, and pages ported one by one from my prototype. If the backend ever opened up, `v2` could become the headless frontend.

About two months in, I made the call to stop. The reasons:

- **The data contract was frozen.** One commit message reads *"Replacing .NET banner logic with new Alpine, will eventually update models"*. "Eventually" depended on backend capacity that wasn't coming. So rebuilding the basket in Alpine didn't *improve* it; it cloned the existing behaviour, quirks and all.
- **Alpine meant rewriting too much jQuery.** The state lived in thousands of jQuery handlers, Kendo widgets and AJAX callbacks that read and write the DOM directly. Making Alpine the source of truth meant rewriting all of them.
- **A parallel layout doubled the surface area.** Every fix had to land in v1 *and* v2, and every new file had to be registered by hand in an old-style `.csproj`.

That was a hard decision to make alone, two months into a project with a deadline. But continuing would have meant delivering half of two sites instead of all of one.

## Attempt #2: change the look, never the behaviour

The new strategy fitted on one line:

> **Change look, never behaviour.** Preserve every `id`, `name`, JS-hook class, every `onclick`, and the DOM structure JS reads.

Restyle in place, and where possible, fix whole *categories* of problems with one global layer instead of touching hundreds of call sites. Alpine stayed only where it's genuinely the right tool: drawers, the header, the cart counter and search.

A few examples:

- **One modal coordinator instead of 1,078 edits.** Bootstrap 4 stacks modals badly, and the basket had its own custom overlay on top. A 75-line `wm-modal.js` listens to Bootstrap's own `show`/`hidden` events, assigns z-indexes, and *derives* scrim visibility from state, so double or orphaned scrims become structurally impossible. No call sites changed.
- **One toast system.** Instead of editing every page's success and error banners, I rewired the helper functions they already called to fire a single global `wmToast()`.
- **One `:has()` selector.** About a dozen FAQ, legal and account pages shared a Bootstrap sidebar layout. One rule turned all of them into a CSS grid:

```scss
.row:has(> .index) {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0.75rem;
}
```

- **A written playbook.** A 10-step checklist per page, and a strict definition of "done": checked on desktop and mobile, and *every interactive control still works*.

The hardest discipline was leaving bugs alone. While restyling the order pages I found a missing `+` in a jQuery string template that had been breaking a tab for real customers. That one was a markup bug, so I fixed it. But I found plenty of others that were behaviour: pagination calling a function copy-pasted from another page, environment-specific date formats toggled by commenting out lines before deploy, and `localhost` URLs saved into production image data by an admin form. Without backend access I couldn't test fixes to those safely, so they went into a list for someone who could.

## The speed wall, and why I measured it

The site feels slow, and leadership understandably hoped the redesign would fix that. I couldn't argue that it wouldn't without evidence, so I built a small diagnostics layer that adds a `Server-Timing` header to every response, splitting backend API time from our own web code:

| Page | Time to first byte |
|---|---|
| Static asset | ~0.09s |
| Privacy policy (controller literally does `return View()`) | **~1.5s** |
| Homepage | ~1.8–1.9s |
| Product listing | **~5s** |

Locally, the full layout renders in about 55ms. In production, a near-static page costs 1.5s because every page makes several **synchronous, sequential** calls to the backend before it can render. Nothing is async, so the calls can't overlap.

That table did more in one meeting than weeks of "it's the backend, honestly". It also answered a question that was starting to circulate: **migrating the web tier to .NET Core wouldn't help.** That's an expensive project avoided.

What I *could* do from my side, I did: removed a category list that was fetched three times per page, cached the homepage so a warm load makes zero backend calls, converted 548 images to WebP (155MB → 16.5MB), and added hover-prefetching to hide some of the latency. The foundational fixes stay on the other side of the wall.

## What "modernised" ended up meaning

| Wanted | Got |
|---|---|
| New design across the site | **Yes.** Homepage, nav, listings, product pages, basket, checkout, account pages, offers, training, legal |
| Modern Tailwind/Alpine frontend | **No.** SCSS ports of the prototype over Bootstrap, with Alpine in a handful of key places |
| A faster site | **Partly.** Lighter images, cached homepage, perceived speed via prefetch. The 1.5s floor is backend-bound |
| Clean data contracts | **No.** Out of the frontend's reach |
| A clear long-term architecture decision | **Yes.** Frontend-only rebuild against the existing API, with the ownership questions on the table |
| 2–3 months | **About 4 months of build**, with a full change of direction halfway through |

## What I'd tell myself ten months ago

**If you're the only technical person, the strategy is your job too.** Nobody else will write the options paper, ask who owns the backend, or explain why a design change costs three weeks. Do it early and in writing, and put the conditions in the document so you can point back at them later.

**Find out who owns the data contract before choosing a stack.** Alpine and Tailwind weren't the wrong tools. They were the wrong *strategy* for a frontend whose state belongs to someone else.

**"Modernise" can quietly mean "reskin".** If you can't change the data layer, you're doing a reskin. That can still be a big improvement, but call it that from day one. It makes every later scope conversation easier.

**Measure before you argue.** "The backend is slow" is an opinion. A `Server-Timing` header showing 1.5 seconds of API time on a privacy policy page is a fact, and it holds up in any meeting.

**Fix it once, not a thousand times.** In a codebase where the markup is the API, the fewer places you touch, the fewer things you break.

**Some walls aren't yours to move, but you can make them visible.** I couldn't fix the backend, get a dev environment, or freeze the designs. What I could do was make the constraints clear enough that the next decision (agency, rebuild, or neither) gets made with the full picture.

For the record, I still think Alpine and Tailwind is a lovely stack. I'll use it properly one day, on a project where I own the data.
