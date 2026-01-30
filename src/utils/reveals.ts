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
  });

  return tl;
}

/**
 * Orchestrate line + mark animation for an element
 */
function animateLinesWithMarks(el: HTMLElement): void {
  // Process marks BEFORE splitting to preserve their structure
  processMarks(el);

  // Create master timeline
  const master = gsap.timeline({
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
    { rotate: 0, yPercent: 0, ease: "power3.out", duration: 0.5, stagger: 0.05, delay: 0.2 }
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
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        animateLinesWithMarks(el);
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
}

export function initReveals(config?: RevealConfig[]) {
  document.fonts.ready.then(() => {
    // Elements with data-sy-reveal="words" attribute
    document.querySelectorAll<HTMLElement>('[data-sy-reveal="words"]:not(.is-in)').forEach((el) => {
      wordsObserver.observe(el);
    });

    // Elements with data-sy-reveal="lines" attribute
    document.querySelectorAll<HTMLElement>('[data-sy-reveal="lines"]:not(.is-in)').forEach((el) => {
      linesObserver.observe(el);
    });

    // Selector-based config (for markdown content)
    config?.forEach(({ selector, type = "words" }) => {
      document.querySelectorAll<HTMLElement>(`${selector}:not(.is-in)`).forEach((el) => {
        el.dataset.syReveal = type;
        if (type === "lines") {
          linesObserver.observe(el);
        } else {
          wordsObserver.observe(el);
        }
      });
    });
  });
}
