import gsap from "gsap";
import SplitType from "split-type";

/**
 * Transform <mark> elements into dual-layer structure for clip-path animation
 * Must be called BEFORE SplitType to preserve mark integrity
 */
function processMarks(el: HTMLElement): void {
  const marks = el.querySelectorAll("mark");

  marks.forEach((mark) => {
    const text = mark.textContent || "";

    // Create wrapper span
    const wrapper = document.createElement("span");
    wrapper.className = "mark-wrapper";

    // Base layer: white text (inherits color)
    const base = document.createElement("span");
    base.className = "mark-base";
    base.textContent = text;

    // Highlight layer: black text on coral bg, will be clipped
    const highlight = document.createElement("span");
    highlight.className = "mark-highlight";
    highlight.textContent = text;

    wrapper.appendChild(base);
    wrapper.appendChild(highlight);

    // Replace mark with wrapper
    mark.parentNode?.replaceChild(wrapper, mark);
  });
}

/**
 * Animate lines with staggered slide-up effect
 */
function animateLines(el: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Split into lines
  const st = new SplitType(el, { types: "lines" });

  // Wrap each line in a mask for overflow hidden
  st.lines?.forEach((line) => {
    const mask = document.createElement("span");
    mask.className = "line-mask";
    line.classList.add("line");
    line.parentNode?.insertBefore(mask, line);
    mask.appendChild(line);
  });

  // Animate lines sliding up
  tl.fromTo(
    st.lines,
    { yPercent: 120, opacity: 1 },
    {
      yPercent: 0,
      ease: "power3.out",
      duration: 0.6,
      stagger: 0.08,
      delay: 0.8
    }
  );

  return tl;
}

/**
 * Animate mark highlights with clip-path wipe
 */
function animateMarks(el: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline();
  const highlights = el.querySelectorAll<HTMLElement>(".mark-highlight");

  if (highlights.length === 0) return tl;

  // Animate clip-path from right to left (revealing left to right)
  tl.to(highlights, {
    clipPath: "inset(0 0% 0 0)",
    ease: "power2.inOut",
    duration: 0.5,
    stagger: 0.1,
    delay: 0.1
  });

  return tl;
}

/**
 * Orchestrate line + mark animation for an element
 * Duplicates element: original for mobile (static), clone for desktop (animated)
 */
function animateLinesWithMarks(el: HTMLElement, elementDelay: number = 0): void {
  console.log('[reveals] animateLinesWithMarks called, class:', el.className);
  // Guard: skip if already processed (prevents double-processing on page transitions)
  if (el.classList.contains("mobile-only") || el.classList.contains("desktop-only")) {
    console.log('[reveals] animateLinesWithMarks SKIPPED (has mobile-only or desktop-only)');
    return;
  }
  // Also check for DOM evidence of processing (line-mask children)
  if (el.querySelector(".line-mask")) {
    console.log('[reveals] animateLinesWithMarks SKIPPED (has .line-mask)');
    return;
  }
  console.log('[reveals] animateLinesWithMarks PROCEEDING with animation');

  // Clone the element before any processing (preserves original HTML with <mark>)
  const mobileEl = el.cloneNode(true) as HTMLElement;

  // Set up mobile version: static, no animation
  mobileEl.classList.add("mobile-only");
  mobileEl.removeAttribute("data-sy-reveal");
  mobileEl.classList.remove("is-in"); // Remove if present

  // Set up desktop version: will be animated
  el.classList.add("desktop-only");

  // Insert mobile version before the desktop version
  el.parentNode?.insertBefore(mobileEl, el);

  // Process marks BEFORE splitting to preserve their structure (desktop only)
  processMarks(el);

  // Create master timeline with element-level delay
  const master = gsap.timeline({
    delay: elementDelay,
    onComplete: () => {
      el.classList.add("is-revealed");
    },
  });

  // Animate lines first
  const linesTl = animateLines(el);
  master.add(linesTl, 0);

  // Animate marks slightly before lines finish (overlap by ~0.15s)
  const marksTl = animateMarks(el);
  master.add(marksTl, "-=0.15");
}

// Word animation (existing functionality)
function animateWords(el: HTMLElement) {
  console.log('[reveals] animateWords called, class:', el.className);
  // Guard: skip if already processed (check for i-mask children)
  if (el.querySelector(".i-mask")) {
    console.log('[reveals] animateWords SKIPPED (has .i-mask)');
    return;
  }

  const st = new SplitType(el, { types: "words" });

  st.words?.forEach((word) => {
    const mask = document.createElement("span");
    mask.className = "i-mask";
    word.classList.add("i");
    word.parentNode?.insertBefore(mask, word);
    mask.appendChild(word);
  });

  gsap.fromTo(
    st.words,
    { opacity: 1, rotate: 5, yPercent: 120 },
    { rotate: 0, yPercent: 0, ease: "power3.out", duration: 0.5, stagger: 0.03, delay: 0.2 }
  );
}

// Observer for words animation
const wordsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        animateWords(el);
        el.classList.add("is-in");
        wordsObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.1 }
);

// Observer for lines animation
const linesObserver = new IntersectionObserver(
  (entries) => {
    console.log('[reveals] linesObserver fired with', entries.length, 'entries');
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        console.log('[reveals] linesObserver entry:', el.className || '(no class)', '| isConnected:', el.isConnected);
        const elementDelay = parseFloat(el.dataset.syDelay || "0");
        animateLinesWithMarks(el, elementDelay);
        el.classList.add("is-in");
        linesObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.1 }
);

export interface RevealConfig {
  selector: string;
  type?: "words" | "lines";
  stagger?: number; // Delay between elements in seconds
}

export function initReveals(config?: RevealConfig[], isFirstLoad: boolean = true) {
  // Disconnect observers to clear any stale state from View Transitions
  wordsObserver.disconnect();
  linesObserver.disconnect();

  // Small delay to let View Transitions finish morphing the DOM
  requestAnimationFrame(() => {
    document.fonts.ready.then(() => {
      // Elements with data-sy-reveal="words" attribute - always animate
      const wordsEls = document.querySelectorAll<HTMLElement>('[data-sy-reveal="words"]:not(.is-in)');
      wordsEls.forEach((el) => wordsObserver.observe(el));

      // Elements with data-sy-reveal="lines" attribute
      const linesEls = document.querySelectorAll<HTMLElement>('[data-sy-reveal="lines"]:not(.is-in)');
      linesEls.forEach((el) => {
        if (isFirstLoad) {
          linesObserver.observe(el);
        } else {
          // Navigation: just show content like mobile does
          el.classList.add("is-in");
        }
      });

      // Selector-based config (for markdown content)
      config?.forEach(({ selector, type = "words", stagger = 0 }) => {
        const fullSelector = `${selector}:not(.is-in):not(.mobile-only):not(.desktop-only)`;
        const elements = document.querySelectorAll<HTMLElement>(fullSelector);
        elements.forEach((el, index) => {
          el.dataset.syReveal = type;
          if (stagger > 0) {
            el.dataset.syDelay = String(index * stagger);
          }
          if (type === "lines") {
            if (isFirstLoad) {
              linesObserver.observe(el);
            } else {
              // Navigation: just show content like mobile does
              el.classList.add("is-in");
            }
          } else {
            // Words: always animate (works well on navigation)
            wordsObserver.observe(el);
          }
        });
      });
    });
  });
}
