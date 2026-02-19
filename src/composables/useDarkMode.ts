import { ref, watch } from "vue";

// Module-level singleton so state is shared across all useDarkMode() calls
const isDark = ref(
  typeof localStorage !== "undefined"
    ? localStorage.getItem("theme") === "dark"
    : false
);

function applyDark(val: boolean) {
  document.documentElement.classList.toggle("dark", val);
}

// Apply immediately when module loads
applyDark(isDark.value);

watch(isDark, (val) => {
  applyDark(val);
  localStorage.setItem("theme", val ? "dark" : "light");
});

export function useDarkMode() {
  return {
    isDark,
    toggle: () => {
      isDark.value = !isDark.value;
    },
  };
}
