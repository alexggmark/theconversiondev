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
    { rotate: 0, yPercent: 0, ease: "power3.out", duration: 0.5, stagger: 0.05, delay: 0.2 }
  );
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        animateWords(el);
        el.classList.add("is-in");
        observer.unobserve(el);
      }
    });
  },
  { threshold: 0.1 }
);

export interface RevealConfig {
  selector: string;
}

export function initReveals(config?: RevealConfig[]) {
  document.fonts.ready.then(() => {
    // Elements with data-sy-reveal="words" attribute
    document.querySelectorAll<HTMLElement>('[data-sy-reveal="words"]:not(.is-in)').forEach((el) => {
      observer.observe(el);
    });

    // Selector-based config (for markdown content)
    config?.forEach(({ selector }) => {
      document.querySelectorAll<HTMLElement>(`${selector}:not(.is-in)`).forEach((el) => {
        el.dataset.syReveal = "words";
        observer.observe(el);
      });
    });
  });
}
