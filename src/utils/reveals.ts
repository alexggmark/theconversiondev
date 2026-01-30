import gsap from "gsap";
import SplitType from "split-type";

const stagger = 100;
const toReveal: { elem: HTMLElement; shouldReveal: boolean }[] = [];
const splitMap = new WeakMap<HTMLElement, SplitType>();

const fns = {
  words(el: HTMLElement) {
    const st = new SplitType(el, { types: "words" });
    splitMap.set(el, st);

    // Wrap words in mask containers
    st.words?.forEach((word) => {
      const mask = document.createElement("span");
      mask.className = "i-mask";
      word.classList.add("i");
      word.parentNode?.insertBefore(mask, word);
      mask.appendChild(word);
    });

    return {
      in() {
        gsap.fromTo(
          st.words,
          { opacity: 1, rotate: 5, yPercent: 120 },
          { rotate: 0, yPercent: 0, ease: "power3.out", duration: 0.5, stagger: { each: 0.05 } }
        );
      },
    };
  },

  lines(el: HTMLElement) {
    const st = new SplitType(el, { types: "lines" });
    splitMap.set(el, st);

    // Wrap lines in mask containers
    st.lines?.forEach((line) => {
      const mask = document.createElement("div");
      mask.className = "i-mask";
      line.classList.add("i");
      line.parentNode?.insertBefore(mask, line);
      mask.appendChild(line);
    });

    return {
      in() {
        gsap.fromTo(
          st.lines,
          { rotateX: 45, yPercent: 120 },
          { rotateX: 0, yPercent: 0, ease: "power3.out", duration: 0.5, stagger: { each: 0.05 } }
        );
      },
      out(next: () => void) {
        gsap.fromTo(
          st.lines,
          { rotateX: 45, yPercent: 0 },
          { rotateX: 0, yPercent: -120, ease: "power4.out", duration: 0.5, stagger: { each: 0.05 }, onComplete: next }
        );
      },
    };
  },
};

let revealIndex = 0;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const elem = entry.target as HTMLElement;
        const currentIndex = revealIndex++;

        const item = { elem, shouldReveal: false };
        toReveal.push(item);

        setTimeout(() => {
          item.shouldReveal = true;
        }, currentIndex * stagger);

        observer.unobserve(elem);
      }
    });
  },
  { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.01 }
);

gsap.ticker.add(() => {
  for (let i = toReveal.length - 1; i >= 0; i--) {
    const item = toReveal[i];
    if (item && item.shouldReveal) {
      const { elem } = item;
      const type = elem.dataset.syReveal as "words" | "lines";
      const fn = fns[type]?.(elem);
      fn?.in();
      elem.classList.add("is-in");
      toReveal.splice(i, 1);
    }
  }
});

export interface RevealConfig {
  selector: string;
  type: "words" | "lines";
}

export function initReveals(additionalSelectors?: RevealConfig[]) {
  document.fonts.ready.then(() => {
    // Handle data-attribute based reveals
    document.querySelectorAll<HTMLElement>("[data-sy-reveal]").forEach((elem) => {
      const type = elem.dataset.syReveal;
      if (type === "words" || type === "lines") {
        observer.observe(elem);
      }
    });

    // Handle selector-based reveals (for markdown content, etc.)
    if (additionalSelectors) {
      additionalSelectors.forEach(({ selector, type }) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((elem) => {
          if (!elem.dataset.syReveal) {
            elem.dataset.syReveal = type;
            observer.observe(elem);
          }
        });
      });
    }
  });
}

export function manualRevealIn(elem: HTMLElement) {
  elem.dispatchEvent(new Event("reveal-in"));
}

export function manualRevealOut(elem: HTMLElement) {
  elem.dispatchEvent(new Event("reveal-out"));
}
