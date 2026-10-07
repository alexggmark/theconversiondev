---
title: 'How I actually use AI: an analyst, not an oracle'
pubDate: '2026-10-07'
description: "I'm suspicious of people who brag about token counts. Here's how I actually use Claude Code for CRO analysis: a structured repo, written rules, and a clear line between spotting patterns and deciding what to build."
tags: ["web"]
---

I've had the same conversation with a lot of senior developers this year. They tell me they burn through <mark>millions of tokens a day</mark>, and say it the way people used to talk about their gym routine.

So I ask what they're actually doing with it. And the list usually goes: summarising documents, rewording emails, reading files they could have skimmed, editing docs, writing tickets. Useful, sure. But it sounds less like a workflow and more like someone trying to hit a quota, as if the token count *is* the achievement.

I'm suspicious of that. Not of AI, but of using it for its own sake.

I only want to use AI where it's genuinely better than me, or genuinely faster without being worse. And after a year of trying, I've found that's a fairly specific place. AI is excellent at reading a lot of data, spotting patterns and describing what's happening. It's much weaker at producing the concrete thing you should actually do about it.

So this article is about the one area where it's earned a permanent place in my work: **CRO analysis**. In my job I do CRO and web development for a few premium skincare Shopify stores, using PostHog, GA4 and a lot of exported CSVs. Here's how Claude Code fits into that, and the rules that make its output worth trusting.

---

## Why chat didn't work

I started where everyone starts: pasting CSVs into a chat and asking questions. The answers sounded great. Too great, in hindsight.

What actually happened:

- **Numbers drifted.** A figure would get retold across a conversation and quietly change.
- **Nothing had a source.** Three weeks later I couldn't tell you which export a number came from.
- **Every new chat needed a handoff summary**, which was itself a second-hand source written by the same model.
- **Nothing stopped the method changing after the results came in.** Not me, not the model. If the conversion rate looked boring, it was very easy to "just check" add to cart instead.

A chat window is fluent, confident and forgetful. That's about the worst combination you could design for an analyst.

So I moved everything into one repo, opened in VS Code, with Claude Code working directly on the files. The old chat-era summaries live in an `archive/` folder with a header that says, verbatim: <mark>*"unverified, never a source of facts"*</mark>. A figure from that era only counts once it's been recomputed from raw data.

What Claude Code gives me that chat doesn't:

- It reads every export itself, instead of relying on my summary of it
- It writes and runs analysis scripts, so numbers are computed, not recalled
- It loads the same written rules at the start of every session
- Its edits show up as diffs, so I review everything before it's committed
- Git timestamps prove *when* a method was decided

---

## The repo is the operating manual

This is the bit people skip, and it's the bit that matters. The folder structure isn't tidiness for its own sake. It's what makes the AI reliable.

```
CLAUDE.md                 # house rules, loaded every session
<STORE>/
  CLAUDE.md               # loads state.md; says when to read the rest
  Raw/                    # source exports, never edited
    README.md             # every file: original name, contents, traps
  Context/
    state.md              # current state, canonical facts, what's pending
    decisions.md          # why we did / didn't; append-only
    experiments.md        # pre-registration + result per test
    archive/              # superseded context, unverified
  Snapshots/              # dated screenshots + README
  scripts/                # reproduce each dated result from Raw/
  YYYY-MM-DD-topic.md     # dated working files
```

A few conventions that do most of the work:

**`Raw/` is immutable, and files are named by the last day the data covers.** `2026-09-30-ga4-daily-bychannel.csv`, not `conversions report_1.csv`. Claude can tell from the filename alone whether a file covers the window it needs, and it never "cleans" a source file in place.

**`Raw/README.md` records the traps.** Every export gets its original download name and anything weird about it: dates stored as text, rows sorted by sessions instead of date, an event that changed how it counts partway through the year, GA4's default channel grouping filing email under "Unassigned". These get written down once, so every future session inherits them instead of rediscovering them (or, worse, not discovering them).

**There's a written authority order.** When two sources disagree, the rule is:

> figures recomputed from `Raw/` > state, decisions and experiments > case study notes > the archive > anything remembered from chat.

That stops the AI quietly picking whichever number is more convenient. It also stops me.

**`decisions.md` is append-only.** Every entry is *Decision / Because (numbers + source file) / Status*. Wrong conclusions are marked `Superseded by…`, never deleted. Claude is told to read it before proposing anything, so it doesn't helpfully re-suggest the thing we already ruled out last week. Decisions *not* to do something go in too.

**`experiments.md` holds a pre-registration for every test**, committed before launch and never edited. The git commit date is the proof the method came first.

**`scripts/` are named after the working file they reproduce.** Any number in any conclusion can be regenerated from `Raw/`. It's a record, not a library.

**One folder per store, and they don't talk.** Claude is told not to carry findings between stores unless I ask, so one store's conclusions don't leak into another's.

---

## The rules I give it

The root `CLAUDE.md` is loaded into every session. The important part is short:

```markdown
## How we work
- Discuss in chat. Only create or update .md files once Alex approves; say exactly what will change first.
- Direct, mechanistic explanations and honest trade-offs; no hedging. UK English.
- Fix the analysis method before looking at the data. Never switch metrics after seeing results.
- Flag your own mistakes plainly. Recompute figures from `Raw/` rather than trusting remembered numbers.
```

Each of those exists because something went wrong without it:

- **Discuss first, write once approved.** I stay the editor of record.
- **Fix the method before the data. Never switch metrics.** Models rationalise towards whatever the data showed, exactly like people do.
- **Recompute, don't recall.** This single line killed number drift.
- **Flag your own mistakes plainly.** More on this below, because it actually works.

A few more rules came later:

**Clean days only, and the promotion calendar comes from order data, never memory.** This one was triggered by *my* memory, not the AI's. I was sure there'd been a sale one June. There hadn't. A "first-order discount" I remembered was actually a markdown for everyone. The rule protects against the human as much as the model.

**Default statistics are written down**, so they're applied identically every time: Wilson intervals for rates, beta-binomial for tests, a gap only counts if the intervals don't overlap, a sample-ratio check before reading any test, and one primary metric read once at the end.

**Post-hoc checks get labelled as post-hoc.** If a check was chosen after seeing results, Claude writes that next to it.

**I commit. The AI never does.** And this isn't a polite request: a Claude Code hook blocks commit and push commands outright. For pre-registrations, my commit timestamp is the proof the method came before the data, so it has to be mine.

---

## Why I didn't automate the data collection

People are usually surprised that I still export CSVs by hand. It's deliberate.

**Every question needs a different cut.** Daily by source by campaign. Funnel by channel by device. Scroll depth on one page. A fixed pipeline would reliably export the wrong thing.

**Manual export plus AI validation is where the problems get found.** Almost every serious data issue surfaced when Claude checked a fresh export against the others:

- one platform's session counting changed in a given month while the other's didn't
- an event's counting changed mid-series, so a year-on-year comparison was meaningless
- orders and "sessions that completed checkout" differed by about a third
- channel groups misfiling traffic

A pipeline would have carried all of that silently into a dashboard. Automation suits stable, trusted data, and this data wasn't there yet.

**Exporting takes minutes. Validating and interpreting is the actual job**, and that's where the AI time goes. What *is* automated is reproducibility: collection is manual and documented, analysis is scripted and re-runnable from inputs nobody can touch.

When the tracking is trustworthy, or I'm running continuous tests across several stores, I'll move to a proper warehouse (GA4 → BigQuery, probably). Not before.

---

## Where I *do* automate: reviews

The exception is voice-of-customer analysis, which is stable, repetitive work. So it gets its own small repo of Python scripts, one pipeline per store, built with Claude Code.

The short version:

1. **Collect** every review (one store via the review platform's public API, the other from the platform's CSV export). The source file is read-only.
2. **Profile** the data before any analysis.
3. **Pass 1:** Claude reads every review and extracts structured "signals" (objections, what convinced them) plus one exact quote. It's told to return null liberally and never infer.
4. **Pass 2:** group signals into themes.
5. **Output:** a report and a bank of verbatim quotes, as a dated PDF that drops into the CRO repo's `Raw/` like any other export.

A couple of engineering decisions I'm quite pleased with:

**It runs inside Claude Code, not through the API.** The API is billed separately, and the whole corpus is tens of thousands of tokens. Claude Code can just read it. As the README puts it: *"The API was only ever a way to get a model to read short reviews."* The API path still exists as a fallback, with every call cached to disk by a hash of model and prompt (so reruns are free), and low reasoning effort for the mechanical extraction step. That's what I mean by treating AI as an engineering cost rather than magic.

**The validation is the whole point.** These quotes are destined for on-page copy, so a quote that's *subtly* not what the customer wrote is a real defect. Every quote gets located in its source review and re-sliced from the original characters. On one store, 131 of 842 quotes were snapped back to the original text (mostly curly vs straight apostrophes), and 21 over-length or mistranscribed quotes were caught before merging. [check clearance on counts]

Counts come from the data, never the model's arithmetic. And quote selection is checked too: before I added that, a review that sat in five themes put a shade complaint under the "drying" heading.

It still isn't perfect. The delivered report notes a few quotes filed under the wrong theme, and that's recorded in the README rather than hidden.

The pipeline also surfaced some data judgement calls I hadn't anticipated:

- **Most reviews on one store weren't the store's.** Only about 4% of reviews shown on site belonged to the UK account; the rest were syndicated in from the US brand. Different climate, price and competitors, so they were excluded. [check clearance]
- **The platform's own pagination total was wrong** (one product reported 3 reviews while returning 4), so the collector stops on a short page instead of trusting it.
- **Unpublished reviews were kept.** About a fifth were unpublished, and most of those were 1–3 star. Dropping them would remove most of the objection signal and just re-describe the on-site star rating.
- **Thin samples show raw counts, not percentages**, so a product with one review reads as "1 review", not "100%".

The honest limitation: reviews come from buyers. They tell you what convinces people, not why most visitors leave.

---

## Where Claude is genuinely strong

This is the part that justifies the setup. Each example follows the same shape: data → pattern → a pre-registered test.

### The purchase decision was below the first screen [confirm]

Claude wrote a PostHog (HogQL) query joining each visitor's maximum scroll depth to whether they added to cart, then mapped it against the measured pixel positions of price, shade swatches and Add to Cart on a standard mobile viewport.

The pattern: Add to Cart sat below the first mobile screen. Visitors who left at the first screen almost never added to cart (2.3%), while those who scrolled just past the button added at 42%. Paid social visitors made up a majority of first-screen leavers. [check clearance]

The important bit: <mark>Claude labelled that relationship as correlational itself</mark>. People who scroll further are more interested, so of course they add to cart more. That's exactly why it became a pre-registered test (a "decision-first" mobile first screen) and not a straight ship.

### The leak wasn't where we thought [confirm]

The working theory on another store was that paid social visitors were being lost in basket or checkout, because add to basket looked healthy at around 22%.

Claude rebuilt the funnel by *users* rather than events. By users, it was 6%. Each adding user was firing about six add-to-cart events. After add to basket, paid social visitors bought at normal rates. [check clearance]

Put that next to the scroll data (two-thirds of paid social mobile visitors leaving within the top tenth of the page), a dated screenshot showing the cookie modal covering the product name on first load, and the review analysis (buyers asking one question: "does it work, and how soon?"), and the problem moved from checkout to the first screen.

The correction was written into the method file in the open:

> **Correction to earlier work:** … reported add to basket at ~22% per session on product pages (an event count). By users it is 6% … The "leak after add to cart" hypothesis built on the 22% is dropped.

That's the "flag your own mistakes" rule doing its job. The wrong number had come from earlier the same day.

### A flaw in our own test [confirm]

Claude noticed a test for a mobile-only change was enrolling every screen size. Desktop was a small share of visitors but a bigger share of adds to cart, so it would dilute the effect and make the test run about a quarter longer.

So we restarted it as v2, with enrolment gated in the theme JS at the CSS breakpoint and a new flag key to re-randomise everyone. The decision log explicitly records that an interim peek at v1's numbers played no part in stopping it.

It also flagged that client-side assignment caused a visible layout jump that would bias against the variant. The anti-flicker fix was applied to both arms equally, and the reasoning was written down.

### Other things it's good at

- Reconciling GA4, Shopify and PostHog when they disagree (they always disagree)
- Splitting a conversion drop into "traffic got colder" vs "the site got worse"
- Turning hundreds of reviews into counted themes
- Reading screenshots against analytics positions (remembering screenshot pixels aren't CSS pixels)
- Writing entries in the house format, so the record stays consistent

---

## Where Claude is weak

Claude is very good at describing *what's* happening and *why*. It's much weaker at deciding what to actually build.

Its suggestions drift towards generic best practice, long hedged lists, or a framework applied mechanically. Plausible on paper, but blind to the things that actually decide whether an idea is any good:

- what the theme can do, and what it costs to build
- what's bold enough to actually measure
- brand tone
- compliance (you can't just name certain medicines in skincare copy)
- what stakeholders will sign off
- what's already been tried

[ALEX: one or two of your own examples. The suggestion, why it was impractical, and what you built instead.]

It can also over-reach in the other direction. On one store I asked it to log some past tests, and it asked me for order-level rows, VAT details, conversion windows and a reconciliation across three exports. The conclusion (every interval included zero) was visible in the first file. That's now a standing rule: *ask for the minimum data the decision needs, and check whether the conclusion already holds first.* Rigour is great until it turns into another way of not deciding.

So the division of labour is:

- **Claude** finds, measures and describes.
- **I** decide what to change, then use Claude to stress-test it: what would disprove it, which metric, what could bias the read.
- Ideas go into `decisions.md` as hypotheses, never as measured effects.

The underlying reason is pretty mechanical. The model sees the data and the docs. It doesn't see the business, the codebase trade-offs or the people. Analysis mostly lives in the files. Good ideas mostly don't.

---

## A typical loop

1. A question comes up: why is this page underperforming?
2. Claude proposes the minimum exports needed. I export them into `Raw/`, and Claude writes the README entry, traps included.
3. We agree a dated method file before any result is read. I commit it.
4. Claude writes the script, runs it, and appends results with intervals.
5. We discuss. I decide what it means for the site.
6. Claude drafts the `decisions.md` / `experiments.md` entries. I review the diff and commit.
7. At launch: screenshots plus a committed pre-registration. Read once, at the end.

---

## What I'd still improve

- **Commit messages.** Most of mine say "update", which is a bit embarrassing for a system built on the audit trail.
- **A template repo**, so a new store starts with the structure and rules on day one.
- **Recording capture setups at capture time** instead of working them out later.
- **Automating collection**, once there's a warehouse worth trusting.

---

## Final thoughts

The AI is useful here *because* it's constrained: written rules, inputs nobody can edit, reasoning that's append-only, and a human who commits. Take those away and you've got a very confident narrator.

None of this needs millions of tokens a day. It needs a folder structure, a few rules and the discipline to write things down. The structure transfers to any analyst and any model. The judgement about what to build doesn't, and honestly, I'd be a bit worried if it did.
