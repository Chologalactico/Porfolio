export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  return media.matches;
}

if (typeof window !== "undefined") {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const emit = (matches) => {
    window.dispatchEvent(new CustomEvent("motion-preference", { detail: { reduced: matches } }));
  };
  emit(media.matches);
  const handler = (event) => emit(event.matches);
  if (media.addEventListener) {
    media.addEventListener("change", handler);
  } else if (media.addListener) {
    media.addListener(handler);
  }
}
