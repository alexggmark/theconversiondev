import gsap from "gsap";
import SplitType from "split-type";

function processMarks(el: HTMLElement): void {
  const marks = el.querySelectorAll("mark");

  marks.forEach((mark) => {
    const text = mark.textContent || "";

    const wrapper = document.createElement("span");
    wrapper.className = "mark-wrapper";

    const base = document.createElement("span");
    base.className = "mark-base";
    base.textContent = text;

    const highlight = document.createElement("span");
    highlight.className = "mark-highlight";
    highlight.textContent = text;

    wrapper.appendChild(base);
    wrapper.appendChild(highlight);

    mark.parentNode?.replaceChild(wrapper, mark);
  });
}

function animateLines(el: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline();

  const st = new SplitType(el, { types: "lines" });

  st.lines?.forEach((line) => {
    const mask = document.createElement("span");
    mask.className = "line-mask";
    line.classList.add("line");
    line.parentNode?.insertBefore(mask, line);
    mask.appendChild(line);
  });

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

function animateMarks(el: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline();
  const highlights = el.querySelectorAll<HTMLElement>(".mark-highlight");

  if (highlights.length === 0) return tl;

  tl.to(highlights, {
    clipPath: "inset(0 0% 0 0)",
    ease: "power2.inOut",
    duration: 0.5,
    stagger: 0.1,
    delay: 0.1
  });

  return tl;
}

function animateLinesWithMarks(el: HTMLElement, elementDelay: number = 0): void {
  if (el.classList.contains("mobile-only") || el.classList.contains("desktop-only")) {
    return;
  }
  if (el.querySelector(".line-mask")) {
    return;
  }

  // copy original for mobile
  const mobileEl = el.cloneNode(true) as HTMLElement;

  mobileEl.classList.add("mobile-only");
  mobileEl.removeAttribute("data-sy-reveal");
  mobileEl.classList.remove("is-in"); // Remove if present

  el.classList.add("desktop-only");

  el.parentNode?.insertBefore(mobileEl, el);

  processMarks(el);

  const master = gsap.timeline({
    delay: elementDelay,
    onComplete: () => {
      el.classList.add("is-revealed");
    },
  });

  // added to animate lines first
  const linesTl = animateLines(el);
  master.add(linesTl, 0);

  const marksTl = animateMarks(el);
  master.add(marksTl, "-=0.15");
}

function animateWords(el: HTMLElement) {
  if (el.querySelector(".i-mask")) {
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

const linesObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
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
  stagger?: number;
}

export function initReveals(config?: RevealConfig[], isFirstLoad: boolean = true) {
  wordsObserver.disconnect();
  linesObserver.disconnect();

  requestAnimationFrame(() => {
    document.fonts.ready.then(() => {
      const wordsEls = document.querySelectorAll<HTMLElement>('[data-sy-reveal="words"]:not(.is-in)');
      wordsEls.forEach((el) => wordsObserver.observe(el));

      const linesEls = document.querySelectorAll<HTMLElement>('[data-sy-reveal="lines"]:not(.is-in)');
      linesEls.forEach((el) => {
        if (isFirstLoad) {
          linesObserver.observe(el);
        } else {
          el.classList.add("is-in");
        }
      });

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
              el.classList.add("is-in");
            }
          } else {
            wordsObserver.observe(el);
          }
        });
      });
    });
  });
}
