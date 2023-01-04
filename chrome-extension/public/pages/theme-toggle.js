window.addEventListener(
  "DOMContentLoaded",
  () => {
    const themeToggle = document.getElementById("theme-toggle");

    const currentTheme = localStorage.getItem("theme")
      ? localStorage.getItem("theme")
      : null;

    if (currentTheme) {
      document.documentElement.setAttribute("data-theme", currentTheme);
    }

    themeToggle.onclick = (e) => {
      console.log(e.target, e.target.dataset.themeValue);
      if (e.target.dataset.themeValue === "light") {
        document.documentElement.classList.add("transition");
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark"); //add this
      } else if (e.target.dataset.themeValue === "dark") {
        document.documentElement.classList.add("transition");
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light"); //add this
      }
    };
  },
  false
);
