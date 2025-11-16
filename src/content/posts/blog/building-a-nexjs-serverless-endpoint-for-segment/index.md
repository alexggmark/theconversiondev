---
title: 'Glue: building a Next.js serverless endpoint to send Segment data back to Shopify'
pubDate: '2025-06-12'
description: "Discover how establishing a daily prayer routine can bring peace and spiritual growth to your life."
tags: ["web"]
---

A few weeks ago I built a small Next.js endpoint to get Segment data back into the browser - so we can read anonymous traits and decide which offers to show, instantly.

We use Twilio’s Segment as our CDP. It ingests Shopify browsing behaviour, lets us build audiences, and forwards those audiences to other tools.

The catch is, for anonymous users, data only flows in one direction: into Segment, not back to the page.

This meant that when my CMO created an `is_affluent` audience (based on GA browsing patterns), there was no way to use that to trigger a “premium” popup. Even with ConvertFlow’s Segment connector, you can only trigger events based on identified users.

With a deadline looming, I had to use Segment’s Profiles API to get this data. This needs server credentials - and exposes pretty sensitive data - so our frontend couldn’t fetch it safely.

As a solution, I built a tiny Next.js route, deployed on Vercel. It sits next to the site, keeps the token private, fetches only the traits we request, and returns a minimal, browser-safe JSON response.

## Why kind of glue is necessary

When we first started talking about Segment, I made a classic mistake: I skim-read the documentation. (In my defense, it’s pretty dull).

What I saw was an `analytics` object in the browser and assumed this had some kind of real-time connection. But it doesn’t. It exists as a local payload that gets updated each time you send fresh data to Segment.

Basically, “what data have we just sent” rather than “what’s live on this user’s account”.

The data we actually want is computed server-side by Segment (i.e. anonymous user matches these traits), meaning our only option was to use the Profile API to request it.

- Analytics.js does persist identifiers and traits that you set via identify() in the browser, typically in cookies/localStorage. That’s not the same as reading Segment-computed traits. Segment+1
- Computed traits and other profile data live behind the Profiles API. You query them server-side (or via a trusted proxy), often using the include= query to fetch only the fields you need. Segment
- Calling that API directly from the browser would expose secrets and still be blocked by CORS unless explicitly allowed. A server shim is the sane route. MDN Web Docs

Anyway, that’s the backdrop. Here’s the endpoint and how it works.

## What I built (at a glance)

- A Next.js Route Handler (app/…/route.ts) that accepts an idType (anonymous_id by default), an idValue, and a list of trait names.
- It makes one authenticated request to Segment’s Profiles API with include= to keep payloads tiny.
- It returns a tidy JSON shape for each trait: value, exists, and a ready-to-use boolean.

### runtime and environment
```typescript
export const runtime = 'nodejs';

const SPACE = process.env.SEGMENT_SPACE_ID!;
const TOKEN = process.env.SEGMENT_PROFILE_TOKEN!;
const ALLOW = process.env.ALLOW_ORIGIN || '*';
```

I force the Node.js runtime to guarantee full Node APIs and predictable behaviour. Secrets live in environment variables - easy locally, safer in Vercel, and no risk of leaking to the browser. The ALLOW origin lets me tighten CORS per environment. Next.js+2Next.js+2

## Making the browser call safe

### CORS and preflight
```typescript
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOW,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'content-type': 'application/json',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
```

Browsers often send a preflight OPTIONS check before the real request. I answer it explicitly and set consistent JSON headers everywhere. It’s boring by design - no surprises when a product page asks the question.

## Small helpers that avoid footguns

### Safe object checks and nested lookup
```typescript
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function hasTraitsKey(v: unknown): v is { traits: unknown } {
  return isRecord(v) && 'traits' in v;
}

/** Safe nested getter with dot-path support */
function getByPath<T = unknown>(obj: unknown, path: string): T | undefined {
  if (!path) return undefined;
  const keys = path.split('.');
  let acc: unknown = obj;

  for (const key of keys) {
    if (!isRecord(acc)) return undefined;
    if (!Object.prototype.hasOwnProperty.call(acc, key)) return undefined;
    acc = (acc as Record<string, unknown>)[key];
  }
  return acc as T | undefined;
}
```

Segment’s response shape can be either { traits: {...} } or a bare object, depending on the workspace. I detect both, and I walk nested objects safely so customer.loyaltyTier or account.tier won’t crash if something is missing.

Parsing requested traits and normalising booleans
function parseRequestedTraits(url: URL): string[] {
  const singles = url.searchParams.getAll('trait').map(s => s.trim()).filter(Boolean);
  const multi = (url.searchParams.get('traits') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const list = [...singles, ...multi];
  return list.length ? Array.from(new Set(list)) : ['is_affluent']; // harmless default
}

function toBooleanish(v: unknown) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

This keeps the query string flexible - ?trait=is_affluent&trait=has_recent_purchase or ?traits=is_affluent,has_recent_purchase. If you forget to pass anything, it defaults to is_affluent, which made our smoke testing easy.

The core GET handler
Choosing the ID and early exit
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const idType = (url.searchParams.get('idType') || 'anonymous_id').toLowerCase() === 'user_id'
      ? 'user_id'
      : 'anonymous_id';

    const idValue =
      url.searchParams.get('idValue') ||
      url.searchParams.get('anonymousId') || // legacy param
      '';

    if (!idValue) {
      return new Response(JSON.stringify({ ok: false, reason: 'no_id' }), {
        status: 200,
        headers: corsHeaders(),
      });
    }

I default to anonymous_id because we need this before sign-in. There’s a legacy anonymousId param for older code. If there’s no id, I still return 200 with ok: false, so the browser has one parsing path and clear semantics.
making one precise call to Segment
   const requestedTraits = parseRequestedTraits(url);

    const auth =
      typeof btoa === 'function'
        ? btoa(`${TOKEN}:`)
        : Buffer.from(`${TOKEN}:`).toString('base64');

    const baseApi = `https://profiles.segment.com/v1/spaces/${SPACE}/collections/users/profiles/${idType}:${encodeURIComponent(idValue)}/traits`;

    // Single, focused call using include=...
    const u = new URL(baseApi);
    u.searchParams.set('include', requestedTraits.join(','));

    const r = await fetch(u.toString(), { headers: { Authorization: `Basic ${auth}` } });

Two important choices here:
include= requests only the fields we care about - is_affluent plus any friends - so responses stay small and quick.


Auth lives server-side and is added just-in-time. (Profiles API access requires a token; don’t ship it to the browser.) Segment+1


Handling 404s, API errors, and success
   if (r.status === 404) {
      const results: Record<string, { value: unknown; exists: boolean; boolean: boolean }> = {};
      for (const t of requestedTraits) results[t] = { value: null, exists: false, boolean: false };
      return new Response(
        JSON.stringify({
          ok: true,
          reason: 'not_found',
          idType,
          idValue,
          traitsRequested: requestedTraits,
          results,
        }),
        { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 'public, max-age=120' } }
      );
    }

    if (!r.ok) {
      const body = await r.text().catch(() => '');
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'api_error',
          httpStatus: r.status,
          statusText: r.statusText,
          api: u.toString(),
          body: body.slice(0, 400),
        }),
        { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 'no-store' } }
      );
    }

If Segment has no profile yet, I return a calm success (ok: true, reason: 'not_found') with short caching. If it’s some other error, I surface a compact error object and mark it no-store so we don’t cache mistakes.
Shaping the response
   const raw: unknown = await r.json();

    const traits: Record<string, unknown> =
      hasTraitsKey(raw) && isRecord(raw.traits)
        ? (raw.traits as Record<string, unknown>)
        : (isRecord(raw) ? (raw as Record<string, unknown>) : {});

    const results: Record<string, { value: unknown; exists: boolean; boolean: boolean }> = {};
    for (const t of requestedTraits) {
      const value = getByPath(traits, t);
      const exists = value !== undefined && value !== null;
      const boolean = toBooleanish(value);
      results[t] = { value, exists, boolean };
    }

    return new Response(
      JSON.stringify({
        ok: true,
        idType,
        idValue,
        traitsRequested: requestedTraits,
        results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
        },
      }
    );
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'error' }), {
      status: 200,
      headers: { ...corsHeaders(), 'Cache-Control': 'no-store' },
    });
  }
}

Three fields per trait:
value — the raw trait value
exists — present vs missing; helpful for deciding whether to retry or fall back.
boolean — ready for instant UI branching
I set shared cache headers so the good path stays snappy under load.

How the page uses it (the launch wiring)
For our skincare launch, the page did something like:
// Pseudocode on the product page
const url = new URL('/api/traits', location.origin);
url.searchParams.set('idType', 'anonymous_id');
url.searchParams.set('idValue', window.analytics?.user().anonymousId()); // or your stored anon id
url.searchParams.set('traits', 'is_affluent'); // default anyway

const res = await fetch(url.toString(), { method: 'GET', credentials: 'omit' });
const data = await res.json();

if (data.ok && data.results?.is_affluent?.boolean) {
  // Show premium popup: 2 luxury gifts + 30% off
  showPremiumOffer();
} else {
  // Alternative: sample kit nudge or free-shipping progress bar
  showGentleNudge();
}

Simple rule: check the boolean, act, move on. No extra parsing, and no fragile dance with cross-site calls.

why Next.js on Vercel for a non-React task?
Route Handlers: one file, first-class GET/OPTIONS, web-standard Request/Response. Easy to reason about and test. Next.js


Runtime control: export const runtime = 'nodejs' gives you the full Node surface when you need it. Next.js


Deploy & scale: Vercel Functions handle the “burst” when a campaign goes live. I didn’t manage servers; I shipped code. Vercel+1


Is it odd to use Next with zero React? A little. But as a packaging format for server endpoints, it’s excellent.

trade-offs I chose
Always 200 with an ok flag. The browser has one parsing path. Handle state, not transport drama.


Short negative caching (120s) smooths the early minutes of brand-new visitors whose traits haven’t settled.


Configurable origins. I started permissive for QA across preview domains, then locked down to live storefronts.


Legacy param support kept older code working during rollout.


Default is_affluent kept smoke tests and dashboards simple—and matched the launch goal.



What this let us achieve
Premium offer at the right time. If is_affluent was true, we showed the luxury bundle with “two gifts + 30% off” straight away.


Margin protection. For that cohort, we suppressed generic discounts that weren’t needed to convert.


Gentle alternatives. If the trait was missing or false, we nudged towards a sample kit or free-shipping progress - helpful, not pushy.


The effect was practical: higher first-order value for the right shoppers, and a calmer experience for everyone else.

## What I learned (and what I read)

I’m not a CDP specialist. This was a fast education in how Segment’s browser library differs from its Profiles API, and why a tiny server (“Javascript glue”) is often helpful. The resources I leaned on:
Next.js Route Handlers & runtime — how to build a one-file HTTP handler and force nodejs. Next.js+1

- Vercel Functions — why serverless can be perfectly fine for a small endpoint. Vercel+1
- CORS & preflight — how to return the right headers and make browsers relax. MDN Web Docs+1
- Segment behaviour — analytics.js persists identifiers/traits you set client-side, but computed traits belong behind the Profiles API. Segment+2Segment+2

Avoiding client exposure — third-party guides that recommend a Next/Vercel proxy to call the Segment Profile API without exposing keys. Uniform DXP Documentation

## Closing thoughts

This wasn’t all that complicated. It was just some careful glue under pressure: one server file that hid the upstream quirks and gave the page usable information - “does this shopper look affluent?”.

Marketing got the moment they wanted; the site stayed lean; secrets stayed server-side; Segment remained the source of truth.
