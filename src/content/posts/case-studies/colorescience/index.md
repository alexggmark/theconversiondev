---
title: 'Mineral Sunscreen Brand CRO'
pubDate: '2026-10-14'
tags: ['hidden']
result: 'CVR held, +82% traffic'
postImg: './_assets/cs-splash-image.png'
---

<!--
DRAFT — before un-hiding:
- [ ] Fill in the test #8 result section (read once, at the stop: first full week with ≥3,060 visitors per variant, hard stop 15 Nov)
- [ ] Clearance from work: naming the brand, and publishing the percentages and rates below. No £, AOV, revenue or traffic totals are in here (by design)
- [ ] Old mobile PDP load time: build_context.md says "up to 10 seconds", Alex said "5s+" in chat. Pick one, with how it was measured. Same for 0.5s and 9.1×
- [ ] Meta spend growth as an index or multiple (e.g. "roughly 3×"), no £. Currently says "grew significantly"
- [ ] Confirm the override was actually ticked on the live theme (settings_data.json history, or replays of control users 5–12 Feb)
- [ ] USP C: change "recommended reverting" to "reverted" once shipped
- [ ] Meta tags: add "fixed" once the paid media team has done it
- [ ] Harness: add "eligibility off by default; QA override limited to the theme editor" if shipped
- [ ] Confirm the brand URL (colorescience.co.uk is a guess)
- [ ] Delete build_context.md from this folder before publishing (or move it to _private/): it sits inside the content collection
- [ ] Charts (see CHART comments)
- Deliberately left out: unpublished reviews / DMCC, refused returns, £ figures, planning-doc projections, the brand being deprioritised internally, build details already covered in the Hydropeptide case study
-->

I run CRO and development for [Colorescience UK](https://colorescience.co.uk/), a premium mineral SPF brand. By August, our reporting showed conversion <mark>up 71% since January</mark>, and the A/B testing programme I'd been running was getting the credit.

When I checked properly, most of that rise was seasonality and bot traffic, and the tests themselves were too small to prove their wins. So I rebuilt how we measure and test.

The clean numbers told a more useful story than the dashboard: traffic grew <mark>82% year on year as paid social scaled, and conversion held</mark>. They also showed where the next real gain is.

![](./_assets/cs-splash-image.png)

***

## Context

Colorescience sells mineral sunscreen direct to consumers. It's premium, 94% of UK sessions are mobile, and it's very seasonal: autumn traffic is around 40% of July's. It's also one of several brands in our group, so development time is shared.

In 2025 I rebuilt the store, moving it from an ageing off-the-shelf theme to a custom Dawn build. Research had shown that speed and an overloaded mobile product page were the main problems. Mobile product pages went from <mark>5s+ to ~0.5s</mark>, and the site overall is 9.1× faster.

A ~16% price rise landed in the same weeks, so I don't credit the rebuild with a specific conversion lift. But it's the foundation everything below sits on.

***

## What the numbers said vs what was happening

The +71% compared January with August. Three things were moving that number that had nothing to do with the site:

- **Seasonality.** In 2024, with no testing programme, conversion rose 79% over the same months.
- **Bots.** From mid-January, a scraper wave hit Direct traffic. In April it was ~91% of Direct sessions: non-UK, 2–5 seconds long, landing straight on SPF product pages. That month, the all-traffic purchase rate was 2.20% against 5.16% for UK visitors. The wave started the same month as the programme, so it dragged the baseline down.
- **Promotions and spikes.** There were three major discount periods in summer 2026, and a podcast in January sent organic traffic to about 4.5× December's level. I rebuilt the promotion calendar from order data, because my memory of the dates turned out to be wrong.

<!-- CHART: conversion by month, 2024 vs 2026 -->

With those removed, I compared the same promotion-free days in both years, UK only:

| Matched days, UK (12–28 Jul + 12–23 Aug) | 2025 | 2026 |
| --- | --- | --- |
| Sessions | — | +82% |
| Purchases | — | +78% |
| Purchase rate (95% interval) | 5.83% (5.42–6.27) | 5.68% (5.37–6.00) |

<!-- CHART: matched-window sessions, purchases and purchase rate with intervals -->

That's the real result for the year, and it's better than it looks. Most of the growth was paid: Paid Search went from 3.5% to 20.4% of sessions, and Meta spend grew significantly. On our product pages, Meta visitors add to cart at about a third of the rate of everyone else. Even so, conversion held, and mobile basket → purchase improved from 35.6% to 38.1%.

***

## Why the tests couldn't tell us

From January to August I ran a six-test programme on PostHog, shipping variants at 75–85% probability of beating control. Re-run over their full periods, UK only:

| Test | Lift, UK (95% interval) | Shipped? |
| --- | --- | --- |
| PDP Recently Viewed | +4.0% (−11% to +22%) | Yes |
| Card Badges | +6.8% (−10% to +27%) | Yes |
| PDP Badges | +5.5% (−15% to +31%) | Yes |
| PLP Recently Viewed | −5.6% (−27% to +21%) | No |
| PLP Badges | +4.5% (−16% to +30%) | No |
| USPs B / C / D / E | +0.7% / −5.6% / −6.4% / −8.0% | C |
| PDP Blocks | −2.5% (−14% to +11%) | No call |

<!-- CHART: every test's lift with its 95% interval, shipped tests marked -->

The shipped tests all point upwards. Combined, they come out at a median of <mark>+11%, with a 73% chance of being positive</mark>. They most likely helped. But every interval crosses zero, so none of them can be proven. There were three reasons:

1. **Too little traffic for the effects.** The plan targeted 4–8% lifts, and a two-week test here carries about ±16% noise.
2. **Early reads.** Mid-test readings ran consistently higher than full-period results (PDP Badges looked like +19.9% before settling at +5.5%). USP variant C was shipped on AOV, a metric chosen after the results were in, while its conversion was most likely below control.
3. **A QA switch on the live site.** For about six weeks, a "turn on all tests" setting showed every visitor the test version. PostHog kept logging a 50/50 split, so two of the shipped tests most likely compared identical pages.

***

## What I changed

| | Before | After |
| --- | --- | --- |
| **Population** | All traffic | UK only, set at flag assignment |
| **Comparisons** | Month on month | Same days year on year, promotion days removed using order data |
| **Sources** | One dashboard at a time | Shopify, GA4 and PostHog reconciled against each other |
| **Test size** | Two weeks, whatever lift came out | Smallest detectable lift worked out before launch; fewer, bolder tests |
| **Decisions** | Read during the test, any metric | One primary metric, pre-registered in git, read once at a planned end |
| **Validity** | Not checked | Chi-square split check before reading any result |
| **Harness** | Flags checked on every page; QA switch could reach live | Rebuilt: flags only load where their test appears |
| **Tracking** | Sticky Add to Cart not counted | One add-to-cart action covering both buttons, applied to past data |

I also re-labelled Card Badges and PDP Badges as untested features (they're candidates for a proper re-test) and recommended reverting USP variant C.

***

## What clean data showed

With numbers I could trust, I went looking for the biggest gap in the funnel. I fixed the method before pulling the data: compare each step against the best comparable segment, on clean days, with minimum sample sizes. The biggest gap was <mark>mobile product page → add to cart</mark>: 20.3% on mobile against 29.6% on desktop.

PostHog event data on the best-selling product showed where the gap opens up. On a standard iPhone, the first screen shows the gallery, rating and title, and the price and Add to Cart sit just below it:

| Deepest point reached | Share of visitors | Added to cart |
| --- | --- | --- |
| First screen only | ~48% | 2–5% |
| Price and swatches | 6% | 11% |
| Just past Add to Cart | 12% | 42% |
| Details, reviews and below | 33% | 37–38% |

Splitting those visitors by source showed where the first-screen exits come from:

| Source (mobile UK) | Share of visitors | Left from first screen | Added to cart |
| --- | --- | --- | --- |
| Meta ads | 39% | 73% | 8.1% |
| Everything else | 61% | 34% | 26.2% |

<!-- CHART: ATC by scroll depth; first-screen exits, Meta vs other -->

The Meta ads had `utm_source` and `utm_medium` swapped, so GA4 most likely filed them under "Unassigned". The fastest-growing channel was <mark>invisible in our channel reports</mark>.

It's the same pattern our 2025 research found before the rebuild. The rebuild fixed the speed, but the first screen still asks a lot of someone who has just tapped an ad.

Two other suspects didn't hold up. The shade picker wasn't the barrier: visitors who compared shades added to cart at the same rate as those who picked one. And the 1,221 store reviews place shade problems *after* purchase, which makes them a returns problem to fix rather than a conversion test.

***

## The test

The change: a decision-first mobile product page, where the title, price, shade swatches and Add to Cart are all visible without scrolling. It reorders existing content across every mobile product page, so it needs no new copy.

The pre-registration was committed to git before launch:

- **Primary metric:** add to cart. Guardrails: purchases and revenue per visitor.
- **Smallest detectable lift:** +15% at 80% power. That's 3,060 visitors per variant, about 5–6 weeks in autumn.
- **One read** at the planned stop, with a hard stop before Black Friday.
- **Ship rule:** the whole 95% interval is above zero, and no guardrail blocks.
- **Meta vs everyone else** is read as a segment chosen in advance.

My first launch enrolled desktop visitors into a mobile-only change and went live before the pre-registration was committed. I stopped it after three days and relaunched it mobile-only.

<!-- TODO: RESULT — read once at the stop. Split check, add-to-cart lift with 95% interval, guardrails, Meta segment, decision. Report it straight whichever way it goes. -->

### Result

*Test running. Result to follow, read once at the planned stop.*

***

## Key Learnings

**Check the denominator before the result.** Seasonality and bots moved this store's conversion rate more than any test did.

**Size tests to the traffic you have.** On a small store, a steady stream of small tests produces confident-looking noise. Fewer, bolder tests with a planned read can actually answer something.

**Break problems down by source.** The biggest product page problem turned out to be one channel, and a tagging mistake had hidden it.
