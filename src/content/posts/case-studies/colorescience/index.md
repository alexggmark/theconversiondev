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
- [ ] Confirm the override was actually ticked on the live theme (settings_data.json history, or replays of control users 5–12 Feb)
- [ ] Confirm the USP C revert has shipped, or reword "I reverted"
- [ ] Confirm the brand URL (colorescience.co.uk is a guess)
- [ ] Charts to build (see the CHART comments): matched-window CVR, 2024 vs 2026 monthly CVR, bot wave, test interval plot, scroll reach, Meta vs other
- Deliberately left out: the unpublished-reviews / DMCC finding, refused returns, £ opportunity sizing, planning-doc revenue projections
-->

I ran the CRO and testing programme for [Colorescience UK](https://colorescience.co.uk/), a premium mineral SPF brand on Shopify. By August, the numbers said the programme had taken conversion from 3.17% to 5.43%: <mark>a +71% recovery</mark>.

So I went back and checked the work properly. That figure didn't hold up, and neither did any of the individual test "wins".

This case study is about what I found: bots, a podcast, promotions, broken test code and mis-tagged ads. It's also about what I changed, and the first test I ran after.

![](./_assets/cs-splash-image.png)

***

## TL;DR

- On matched, promotion-free days, UK conversion was <mark>flat year on year</mark>: 5.83% vs 5.68%. Sessions grew 82%, and that's where all the growth came from.
- I re-analysed all seven tests on clean data. None was a credible win. Two shipped "winners" most likely ran while control saw the test version.
- Half of mobile product page visitors were leaving from the first screen, and most of them were coming from one mis-tagged ad channel.
- I rebuilt the test setup, then pre-registered one properly powered test, committed to git before launch.

***

## Business Context

Colorescience sells mineral sunscreen direct to consumers. It's a premium product for women 30+, and the business is very seasonal: in autumn, traffic falls to around 40% of July's. 94% of UK sessions are on mobile.

At the start of 2026 I put together a six-test programme across navigability, trust and price objections. It ran from January to August using PostHog's Bayesian experiments, with tests shipped at 75–85% probability of beating control.

By August, the story going round was simple:
- the 2025 theme rebuild lifted conversion 58%;
- a January price rise tanked it;
- the testing programme brought it back, +71%.

<mark>None of it reproduces from the data.</mark>

***

## How I checked

I set the rules before looking at any results, so the logic couldn't bend to fit what I found:

- **Three sources, checked against each other.** Shopify orders and reports, GA4 through Looker Studio, and raw PostHog events through SQL. Every export was reconciled against a known total before I used it.
- **UK only.** That's who can actually buy. Non-UK was ~34% of visitors but ~5% of conversions.
- **Promotion days excluded.** I rebuilt the promotion calendar for both years from order data: discount codes, markdowns and gifts with purchase.
- **Intervals on everything.** Wilson 95% intervals on rates, and beta-binomial credible intervals on tests. A gap only counts if the intervals don't overlap.
- **A split check before any lift.** Chi-square on exposure counts.

Building the calendar from orders mattered more than I expected. My own memory of the promotions was wrong: there was no June 2025 sale, and the August 2026 "first SPF" offer was actually a markdown for everyone.

***

## Problem 1: Bot traffic

Monthly sessions were swinging from 9k to 49k while orders stayed in a narrow band. That's the classic sign of bots.

Breaking out Direct traffic by country, device, landing page and browser showed it clearly. In April 2026, about 91% of Direct sessions were non-UK desktop Chrome. They had ~5% engagement and 2–5 second sessions, and 92% landed straight on SPF product pages. It looked like a price scraper, or an AI shopping crawler that runs JavaScript.

<!-- CHART: Direct sessions vs purchases, Jan–Jul 2026 -->

The effect was big. In April, the GA4 purchase rate was <mark>2.20% across all traffic, against 5.16% for UK traffic</mark>.

The bots also arrived in mid-January, the same month the programme started. So the programme's starting baseline was artificially low, and part of the "recovery" was just the bots leaving.

(The good news: bots were randomly split across test variants. They lowered absolute rates but didn't bias the lifts. I checked: UK-only and all-traffic lifts match for every test.)

My first fix was to exclude all Direct traffic. That was wrong: UK Direct converts at 5–10%, so I was removing real buyers, and it inflated the year-on-year gain to +35%. Filtering to UK across every channel was the right definition.

***

## Problem 2: Seasonality, promotions and the denominator

**Seasonality.** In 2024, with no testing programme, conversion rose <mark>79% from January to August</mark>. The programme claimed +71% over the same months. Any January-to-August comparison flatters whatever started in January.

**The denominator.** CVR is a ratio. 2025 vs 2024 looked like +38% conversion, but sessions fell 30% while orders fell only 4%. The session drop started in September 2024, seven months before the theme launched. The theme "win" was mostly a smaller denominator.

**One-off events.** A podcast episode in January 2026 sent UK organic sessions to about 4.5× December's level. Orders went up, but conversion went down.

**Price.** The price rise everyone remembered as January 2026 was actually ~16%, in spring 2025. Order data and the Wayback Machine agree. It landed at the same time as the theme relaunch, so its effect on conversion can't be separated out. Both summers come after it, though, so comparing summer to summer is fair on price.

Once all of that was stripped out, the result was this:

| Matched clean window, UK (12–28 Jul + 12–23 Aug) | 2025 | 2026 |
| --- | --- | --- |
| Sessions | — | +82% |
| Purchases | — | +78% |
| Purchase rate (95% interval) | 5.83% (5.42–6.27) | 5.68% (5.37–6.00) |

<!-- CHART: matched-window purchase rate with intervals; 2024 vs 2026 monthly CVR -->

<mark>Flat.</mark> The business grew because traffic grew, mostly from Paid Search, which went from 3.5% to 20.4% of sessions. Organic and Direct conversion actually fell.

***

## Re-analysing every test

The planning doc recorded readings that looked like mid-test peeks. I re-ran every test over its full period, UK only:

| Test | Planning doc | Full period, UK (95% interval) | Shipped? |
| --- | --- | --- | --- |
| PDP Recently Viewed | +4.5% | +4.0% (−11% to +22%) | Yes |
| Card Badges | +12.7% | +6.8% (−10% to +27%) | Yes |
| PDP Badges | +19.9% | +5.5% (−15% to +31%) | Yes |
| PLP Recently Viewed | — | −5.6% (−27% to +21%) | No |
| PLP Badges | +5.1% | +4.5% (−16% to +30%) | No |
| USPs B / C / D / E | +2.8% to −5.4% | +0.7% / −5.6% / −6.4% / −8.0% | C (on AOV) |
| PDP Blocks | −1.2% | −2.5% (−14% to +11%) | No call |

<!-- CHART: every test's lift with its 95% interval, shipped tests marked -->

Taken together, the shipped changes come out at a median of +11%, with a 95% interval from <mark>−20% to +54%</mark>. That's a 73% chance of being positive at all. You can't call that a win.

What went wrong, in order of how much it hurt:

- **The plan couldn't detect what it was looking for.** It aimed for 4–8% lifts. A two-week test on this traffic gets about ±16% noise on relative lift. Every result was always going to be noise.
- **Winner's curse and peeking.** PDP Badges read +19.9% at 92% in the planning doc, and +5.5% over the full period. If you ship whatever clears a threshold on noisy data, you end up shipping lucky draws.
- **Switching metrics after the fact.** No USP message beat control on conversion. I shipped variant C on AOV, picked after the results were in, from 4 variants × 2 metrics. You'd expect one ~90% result by chance. On clean data, C had an <mark>87% chance of hurting conversion</mark>, so I reverted it.
- **Uneven splits.** The first three tests had a sample ratio mismatch, with the test arm larger every time. Those results can't be trusted, whatever they say.
- **Decision rules applied inconsistently.** Test 1 shipped at 68%, below its own 70% threshold. PLP Badges was held at 66%.

I also got burned by benchmark stats in the plan that I couldn't verify. Lesson learned: if you can't trace a source, don't use it to justify a test.

***

## The test harness

Going back through the theme's git history, I found something worse. From 30 January to 11 March, a "turn on all A/B tests" QA setting was enabled in the theme settings.

PostHog was still assigning and logging a 50/50 split, but everyone saw the test version. Card Badges and PDP Badges, both shipped as winners, <mark>most likely compared two identical pages</mark>.

There were other problems too:

- `isFeatureEnabled()` on a multivariate flag returns true for control. So control saw the test version in several tests, including the USP test.
- A flag name in the code didn't match PostHog for five weeks.
- Every flag was checked on every page, which diluted each experiment with people who never saw the change.

I rebuilt the harness in July, so flags are only checked on pages where their test can appear. <!-- TODO: if shipped, add: eligibility off by default; QA override limited to the theme editor --> Card Badges and PDP Badges are now labelled as untested features, and they're candidates for a proper re-test.

***

## Finding the real problem

With clean measurement in place, I could finally ask the useful question: where are mobile shoppers actually lost?

I fixed the method before pulling the data: traffic reaching a step × gap to the best comparable segment, clean days only, with minimum sample sizes. **Mobile product page → add to cart** came out on top. It was 20.3% on mobile against 29.6% on desktop, and it had fallen year on year with intervals that don't overlap.

### What visitors actually do on the page

I wrote SQL against raw PostHog events for the best-selling tinted SPF: scroll depth, swatch clicks and add to cart, per visitor.

On a standard iPhone, the first screen shows the gallery, badges, rating and title. <mark>Price, shades and Add to Cart sit just below it.</mark>

| Deepest point reached | Share of visitors | Added to cart |
| --- | --- | --- |
| First screen only / no scroll data | ~48% | 2–5% |
| Price and swatches | 6% | 11% |
| Just past Add to Cart | 12% | 42% |
| Details, reviews and below | 33% | 37–38% |

<!-- CHART: scroll reach down the page with price, swatches, reviews marked; ATC by depth -->

About half of visitors leave from the first screen, and almost none of them add to cart. Engaged visitors are fine. (I first read the cluster stopping just past Add to Cart as "hesitating". They're actually the highest-converting group, on their way to the basket.)

The shade picker was my main suspect, but it isn't where people give up. Visitors who compared two or more shades added to cart at 47%, against 49% for those who clicked one.

### One channel, mis-tagged

When I split the first-screen leavers by traffic source, the problem was mostly one channel:

| Source (mobile UK visitors) | Share of visitors | Left from first screen | Added to cart |
| --- | --- | --- | --- |
| Meta ads | 39% | 73% | 8.1% |
| Everything else | 61% | 34% | 26.2% |

<!-- CHART: first-screen exits and ATC, Meta vs other -->

The Meta ads had `utm_source` and `utm_medium` the wrong way round. PostHog classed them as organic social, and GA4 most likely dumped them in Unassigned, so for months <mark>the biggest traffic source on the product pages had been invisible in channel reports</mark>.

(PostHog's person-level source fields were empty for 98% of visitors, because anonymous visitors don't get person profiles. The fix was to use each session's entry source instead.)

### What 1,221 reviews say

I ran a voice-of-customer analysis on every review in the UK store. Shade was the top complaint by far. Put that next to the behavioural data and it lands after purchase, not before: people buy a shade blind, get it wrong, and leave a 1-star review.

So shade isn't a conversion test. It's a fix: correcting the site's "size down if between shades" advice (several reviewers quote it as the reason they bought the wrong one), and setting expectations ("it goes on white, then settles"), judged on returns and review themes.

***

## The next test, done properly

**What I chose not to run:**
- A Meta-only test. It reaches 39% of visitors, so only a ~30% lift would be detectable, and part of the gap is intent no page can fix.
- Below-the-fold content. The people being lost never scroll that far.
- Sticky Add to Cart changes. Only 2% of people who add to cart use the sticky button alone.

**What I chose instead:** a "decision-first" mobile first screen on every product page. A compact gallery, with title, price, shade swatches and Add to Cart all visible without scrolling. It reorders existing content, so it needs no new content or sign-off.

The pre-registration was committed to git before launch:

- **Primary metric:** share of exposed visitors who add to cart.
- **Guardrails:** purchases, and revenue per visitor (non-buyers as £0, capped at the 99th percentile). Revenue per visitor can block a ship but not prove a win, because it needs ~45% more traffic than conversion.
- **Minimum detectable effect:** +15% relative, at 80% power. That's 3,060 visitors per variant.
- **Stopping rule:** read once, at the first full week with enough sample. Hard stop before any Black Friday promotion.
- **Ship rule:** the credible interval for the lift sits entirely above zero, and no guardrail blocks.
- **Pre-registered segment:** Meta arrivals vs everything else.
- **Checks:** a chi-square split check daily for the first three days, and UK-only assignment at the flag level.

The first version enrolled every screen size for a mobile-only change, which diluted a true +15% to about +12.5%. It also launched before the pre-registration was committed. I stopped it after three days and relaunched it mobile-only with a new flag key. I didn't base that on the interim numbers: at that sample size they were unreadable anyway.

I also added an anti-flicker hide that applies equally to both variants, so the client-side flag assignment doesn't penalise the test layout.

<!-- TODO: RESULT — read once at the stop. Split check, add-to-cart lift with 95% interval, guardrails, Meta segment, decision. Report it straight whichever way it goes. -->

### Result

*Test running. Result to follow, read once at the planned stop.*

***

## What I'd tell myself in January

**On low traffic, a fast programme of small tests produces confident-looking noise.** The fix isn't better statistics after the fact. It's deciding the measurement, the test length and the decision rule before launch.

- Work out the minimum detectable effect first. If the expected lift is smaller than the noise, make the change bolder or don't run it.
- Check the split before you look at the lift.
- Pick one primary metric, read it once, and never switch after seeing the results.
- Compare year on year on clean days, never January to August. Check sessions and orders separately before trusting CVR.
- Break a page problem down by traffic source before redesigning the page.
- Build a shared promotion calendar from data, not memory.
- Make it impossible for QA switches to reach the live theme.

A lot of this is me correcting myself. That's uncomfortable to write up, but it's also the point: the programme only got trustworthy once I was willing to find out that it wasn't.
