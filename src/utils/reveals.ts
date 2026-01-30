import gsap from "gsap";
import SplitType from "split-type";

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
    { rotate: 0, yPercent: 0, ease: "power3.out", duration: 0.5, stagger: 0.05 }
  );
}

function animateLines(el: HTMLElement) {
  const st = new SplitType(el, { types: "lines" });

  st.lines?.forEach((line) => {
    const mask = document.createElement("div");
    mask.className = "i-mask";
    line.classList.add("i");
    line.parentNode?.insertBefore(mask, line);
    mask.appendChild(line);
  });

  gsap.fromTo(
    st.lines,
    { rotateX: 45, yPercent: 120 },
    { rotateX: 0, yPercent: 0, ease: "power3.out", duration: 0.5, stagger: 0.05, delay: 0.4 }
  );
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        const type = el.dataset.syReveal;

        if (type === "words") animateWords(el);
        if (type === "lines") animateLines(el);

        el.classList.add("is-in");
        observer.unobserve(el);
      }
    });
  },
  { threshold: 0.1 }
);

export interface RevealConfig {
  selector: string;
  type: "words" | "lines";
}

export function initReveals(config?: RevealConfig[]) {
  document.fonts.ready.then(() => {
    // Elements with data-sy-reveal attribute
    document.querySelectorAll<HTMLElement>("[data-sy-reveal]:not(.is-in)").forEach((el) => {
      observer.observe(el);
    });

    // Selector-based config (for markdown content)
    config?.forEach(({ selector, type }) => {
      document.querySelectorAll<HTMLElement>(`${selector}:not(.is-in)`).forEach((el) => {
        el.dataset.syReveal = type;
        observer.observe(el);
      });
    });
  });
}
