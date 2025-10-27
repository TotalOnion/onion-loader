export const options = {
  // root: document.querySelector('#scrollArea'),
  rootMargin: "0px",
  scrollMargin: "0px",
  threshold: 1,
};
export function triggerEntryAnimation(element, loaderOptions) {
  const intersectionCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let elem = entry.target;

        elem.classList.add("trigger-animation");
      }
    });
  };
  const observer = new IntersectionObserver(intersectionCallback, options);

  observer.observe(element);
}
