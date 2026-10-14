---
title: 'Mineral Sunscreen Brand CRO'
pubDate: '2026-10-14'
tags: ['hidden']
result: 'AUDIT'
postImg: './_assets/cs-splash-image.png'
---

<!--
DRAFT — before un-hiding:
- [ ] Fill in the test #8 result section (read once, at the stop: first full week with ≥3,060 visitors per variant, hard stop 15 Nov)
- [ ] Update the `result:` frontmatter once #8 is read
- [ ] Clearance from work: naming the brand, and publishing the percentages and rates below. No £, AOV, revenue or traffic totals are in here (by design)
- [ ] Confirm the intro's trigger is accurate ("when I sat down to write it up, I couldn't reproduce the headline numbers")
- [ ] Confirm the override was actually ticked on the live theme (settings_data.json history, or replays of control users 5–12 Feb)
- [ ] Confirm the USP C revert has shipped, or reword "I reverted"
- [ ] Confirm the brand URL (colorescience.co.uk is a guess)
- [ ] Charts to build (see the CHART comments): matched-window CVR, 2024 vs 2026 monthly CVR, bot wave, test interval plot, scroll reach, Meta vs other
- Deliberately left out: the unpublished-reviews / DMCC finding, refused returns, £ opportunity sizing, planning-doc revenue projections
-->

I ran the CRO and testing programme for [Colorescience UK](https://colorescience.co.uk/), a premium mineral SPF brand on Shopify. Over eight months, conversion went from 3.17% to 5.43%: <mark>a +71% recovery</mark>, credited to the tests.

But when I sat down to write it up, I couldn't reproduce that number from the raw data. Digging into why turned up two problems:

1. **The conversion rate wasn't measuring the site.** It was moving with things the tests didn't touch: the time of year, bot traffic, promotions and changes in where visitors came from.
2. **The tests couldn't measure anything either.** They were too small to detect the lifts they were looking for, and a setup bug meant some of them compared two identical pages.

Once I'd corrected for both, conversion was <mark>flat year on year</mark>, and none of the tests was a credible win.

That's the uncomfortable half of this case study. The useful half is what the clean data showed next: where mobile shoppers were really being lost, and the first test I designed so its result would actually mean something.

![](./_assets/cs-splash-image.png)

***

## TL;DR

- **Reported:** conversion +71%, January to August, from a six-test programme.
- **Actually:** on matched, promotion-free days, UK conversion was 5.83% in 2025 and 5.68% in 2026. Flat. The business grew because traffic grew 82%.
- **The tests:** re-analysed on clean data, none was a credible win. The shipped changes together come out somewhere between −20% and +54%.
- **The real problem:** half of mobile product page visitors were leaving from the first screen, and most of them came from one ad channel that was mis-tagged in our reports.
- **Next:** one pre-registered, properly powered test, with its method committed to git before launch.

***

## Business Context

Colorescience sells mineral sunscreen direct to consumers. It's a premium product for women 30+, and 94% of UK sessions are on mobile.

It's also very seasonal. SPF sells in summer, and autumn traffic is around 40% of July's. That matters a lot later on.

At the start of 2026 I put together a six-test programme covering navigability, trust and price objections. It ran from January to August on PostHog's Bayesian experiments, and tests were shipped once they reached a 75–85% probability of beating control.

***

## How I checked

Before I looked at any results, I fixed the rules I'd use, so I couldn't bend the method to fit what I found:

- **Three sources, checked against each other:** Shopify orders, GA4 (through Looker Studio) and raw PostHog events (through SQL). Every export was reconciled against a known total before I used it.
- **UK traffic only.** That's who can actually buy. Non-UK was ~34% of visitors but only ~5% of conversions.
- **Promotion days removed.** I rebuilt the promotion calendar for both years from order data, covering discount codes, markdowns and gifts with purchase.
- **A 95% interval on every number.** A difference only counts if the intervals don't overlap.

***

## Problem 1: The conversion rate wasn't measuring the site

CVR is a ratio: orders divided by sessions. It goes up if the site gets better, but it also goes up if the *wrong kind* of sessions disappear, if you compare a busy month to a quiet one, or if a sale is running. Four things like that were moving our CVR, and none of them had anything to do with the tests.

### The time of year

In 2024, with no testing programme at all, conversion rose <mark>79% from January to August</mark>. The programme claimed +71% over exactly the same months.

January is when people aren't buying sunscreen. August is when they are. Any January-to-August comparison makes whatever started in January look brilliant.

<!-- CHART: conversion by month, 2024 vs 2026: the Jan→Aug rise happens every year -->

### Bot traffic

From mid-January, monthly sessions swung between 9k and 49k while orders barely moved. That usually means bots.

When I broke Direct traffic down by country, device and landing page, the pattern was clear. In April, ~91% of Direct sessions were non-UK desktop Chrome visits lasting 2–5 seconds, almost all landing straight on SPF product pages. It looked like a price scraper.

Bots add sessions but never buy, so they drag conversion down. In April, the purchase rate across all traffic was <mark>2.20%, against 5.16% for real UK visitors</mark>.

The bots arrived in mid-January, the same month the programme started. So the programme's starting point was artificially low, and part of the "recovery" was just the bots leaving.

<!-- CHART: Direct sessions vs purchases, Jan–Jul 2026 -->

### Promotions and one-off spikes

Sales lift conversion for as long as they run, and they don't average out: each one boosts specific channels and products. Rebuilding the calendar from order data turned up three major discount periods in summer 2026 alone, and showed that my memory of the 2025 dates was wrong.

One-off traffic spikes do the reverse. A podcast about the brand in January sent organic traffic to about 4.5× December's level. Orders went up, but conversion went down, because lots of curious new visitors don't buy straight away.

### Where visitors came from

Paid Search went from 3.5% to 20.4% of sessions between the two summers, and it converts well. Meanwhile Organic and Direct conversion fell. In the overall average, those cancel out and look like "stable".

(The same trap explains the theme rebuild's "+58%". In 2025, sessions fell 30% but orders fell only 4%. The site didn't sell more; fewer low-intent visitors arrived. The session drop had started seven months before the new theme launched.)

### The like-for-like answer

Once the bots, promotions and seasonality were stripped out, I compared the same summer days in both years, UK only:

| Same promotion-free days, UK (12–28 Jul + 12–23 Aug) | 2025 | 2026 |
| --- | --- | --- |
| Sessions | — | +82% |
| Purchases | — | +78% |
| Purchase rate (95% interval) | 5.83% (5.42–6.27) | 5.68% (5.37–6.00) |

<!-- CHART: matched-window purchase rate with intervals -->

<mark>Flat.</mark> The business did grow, but through more traffic, not a better-converting site.

I made mistakes along the way too. My first fix was to exclude all Direct traffic, which also removed real UK buyers and inflated the gain to +35%. I also built a price analysis on a January price rise that, according to the order data, actually happened a year earlier. Checking against the raw data is what caught both.

***

## Problem 2: The tests couldn't measure anything

Even with a clean conversion rate, the tests still needed to show their own wins. When I re-ran each one over its full period, UK only, none of them did:

| Test | Reported at the time | Full period, UK (95% interval) | Shipped? |
| --- | --- | --- | --- |
| PDP Recently Viewed | +4.5% | +4.0% (−11% to +22%) | Yes |
| Card Badges | +12.7% | +6.8% (−10% to +27%) | Yes |
| PDP Badges | +19.9% | +5.5% (−15% to +31%) | Yes |
| PLP Recently Viewed | — | −5.6% (−27% to +21%) | No |
| PLP Badges | +5.1% | +4.5% (−16% to +30%) | No |
| USPs B / C / D / E | +2.8% to −5.4% | +0.7% / −5.6% / −6.4% / −8.0% | C (on AOV) |
| PDP Blocks | −1.2% | −2.5% (−14% to +11%) | No call |

<!-- CHART: every test's lift with its 95% interval, shipped tests marked -->

Every interval crosses zero. In plain terms, each test is consistent with helping, hurting or doing nothing. Taken together, the shipped changes land somewhere between <mark>−20% and +54%</mark>.

There were three reasons for that.

### They were too small to detect what they were looking for

The plan expected lifts of 4–8%. A two-week test on this traffic carries about ±16% of random noise. You can't see a 5% effect through 16% of noise, so whatever each test showed was mostly chance. I should have done that maths before launching, not after.

### Reading early, then switching metrics

The "reported" column was read while the tests were running, on a good day. PDP Badges looked like +19.9% at 92% confidence, and over the full period it was +5.5%. If you ship whatever crosses a threshold on noisy data, you end up shipping lucky readings.

The USP test had a different version of the same problem. No message beat control on conversion, so I shipped variant C because its AOV looked good. That metric was picked *after* seeing the results, out of four variants × two metrics. With that many comparisons, one ~90% result turns up by chance. On clean data, C had an <mark>87% chance of hurting conversion</mark>, so I reverted it.

### A setup bug meant some tests compared identical pages

Going back through the theme's git history, I found that from 30 January to 11 March a QA switch, "turn on all A/B tests", had been left enabled on the live site.

PostHog kept splitting visitors 50/50 and logging them as control or test, but everyone saw the test version. Card Badges and PDP Badges, both shipped as winners, <mark>most likely compared two identical pages</mark>. A second bug (`isFeatureEnabled()` returns true for control on multivariate flags) did the same to the USP test.

The first three tests also had uneven splits, with the test arm larger every time. That alone makes a result untrustworthy, whatever it says.

I rebuilt the harness in July, so flags are only checked on pages where their test can appear. <!-- TODO: if shipped, add: eligibility off by default; QA override limited to the theme editor --> Card Badges and PDP Badges are now labelled as untested features, and they're candidates for a proper re-test.

***

## What was actually going on

With measurement I could trust, I could finally ask the useful question: **where are mobile shoppers being lost?**

I fixed the method before pulling the data: compare each funnel step against the best comparable segment, on clean days, with minimum sample sizes. The biggest gap was <mark>mobile product page → add to cart</mark>: 20.3% on mobile against 29.6% on desktop, and lower than the year before.

### Half of visitors leave before they see the price

I wrote SQL against raw PostHog events for the best-selling product, a tinted SPF, to see how far each visitor scrolled and whether they added to cart.

On a standard iPhone, the first screen shows the gallery, badges, rating and title. Price, shade swatches and Add to Cart are all just below it.

| Deepest point reached | Share of visitors | Added to cart |
| --- | --- | --- |
| First screen only | ~48% | 2–5% |
| Price and swatches | 6% | 11% |
| Just past Add to Cart | 12% | 42% |
| Details, reviews and below | 33% | 37–38% |

<!-- CHART: scroll reach down the page with price, swatches, reviews marked; ATC by depth -->

Visitors who scroll are fine: over a third of them add to cart. The loss is the half who leave from the first screen without ever seeing a price.

It wasn't the shade picker either, which had been my main suspect. Visitors who compared several shades added to cart at the same rate (47%) as those who clicked one (49%).

### Most of those visitors came from one ad channel

Splitting first-screen leavers by traffic source showed that the problem was mostly one channel:

| Source (mobile UK visitors) | Share of visitors | Left from first screen | Added to cart |
| --- | --- | --- | --- |
| Meta ads | 39% | 73% | 8.1% |
| Everything else | 61% | 34% | 26.2% |

<!-- CHART: first-screen exits and ATC, Meta vs other -->

The Meta ads are fairly generic, and almost all of them link straight to a product page. Someone who's just tapped an ad lands on a bottle shot and a title, with no price in sight.

We hadn't spotted this sooner because the ads were mis-tagged: `utm_source` and `utm_medium` were the wrong way round. GA4 most likely filed them under "Unassigned", so <mark>the biggest traffic source on the product pages was invisible in channel reports</mark>.

### Reviews put the shade problem after purchase

I also analysed all 1,221 UK reviews. Shade was the top complaint by far. Combined with the behavioural data, it shows that shade doesn't stop people buying. It goes wrong *after* they buy: people choose a shade blind, get it wrong and leave a 1-star review.

That makes shade a fix rather than a conversion test. The fixes were to correct the site's "size down if between shades" advice (several reviewers quote it as the reason they bought the wrong one) and to set expectations ("it goes on white, then settles").

***

## The next test, done properly

Everything above points at one change: put the buying decision on the first screen. I designed it as a "decision-first" mobile product page, with a compact gallery and the title, price, shade swatches and Add to Cart all visible without scrolling. It reorders existing content, so it needs no new copy or sign-off, and it covers every mobile product page.

**What I chose not to run:**
- A Meta-only version. It reaches 39% of visitors, so only a ~30% lift would be detectable. Meta visitors are included anyway and are read as a segment.
- New content further down the page. The people being lost never scroll that far.

This time, the pre-registration was committed to git before launch. That's the proof the method came before the data:

- **Primary metric:** the share of visitors who add to cart.
- **Guardrails:** purchases and revenue per visitor. These can stop a ship, but not prove a win.
- **Smallest detectable lift:** +15%, at 80% power. That works out at 3,060 visitors per variant, about 5–6 weeks in autumn.
- **One read:** at the first full week with enough visitors, with a hard stop before Black Friday.
- **Ship rule:** the whole 95% interval for the lift sits above zero, and no guardrail blocks.
- **Split check:** daily for the first three days, before anything else gets read.

Even then, I got the first launch wrong. It enrolled desktop visitors into a mobile-only change, which watered the effect down, and it went live before the pre-registration was committed. I stopped it after three days and relaunched it mobile-only. That decision was based on the setup, not on the early numbers, which were unreadable at that sample size anyway.

<!-- TODO: RESULT — read once at the stop. Split check, add-to-cart lift with 95% interval, guardrails, Meta segment, decision. Report it straight whichever way it goes. -->

### Result

*Test running. Result to follow, read once at the planned stop.*

***

## What I'd tell myself in January

**On a low-traffic store, a fast programme of small tests produces confident-looking noise.** Better statistics after the fact won't fix it. What fixes it is deciding the measurement, the test length and the decision rule before launch.

- Work out the smallest lift you can detect first. If it's bigger than the lift you expect, make the change bolder or don't run it.
- Check the split before looking at the result.
- Pick one metric, read it once, and never switch after seeing the results.
- Compare the same days year on year, never January to August, and check sessions and orders separately before trusting CVR.
- Break a page problem down by traffic source before redesigning the page.
- Build the promotion calendar from order data, not memory.
- Make it impossible for QA switches to reach the live site.

Most of this case study is me correcting myself. That's uncomfortable to publish, but it's the point: the programme only became trustworthy once I was willing to find out it wasn't.
