export const colors = {
  base: "#0A0A0F",
  mantle: "#06060A",
  crust: "#000000",
  surface0: "#14141F",
  surface1: "#1C1C2B",
  surface2: "#2A2A3D",
  overlay0: "#5C5C7A",
  text: "#F0F0F8",
  subtext0: "#A0A0B8",
  lavender: "#B8C4FF",
  blue: "#6E9BFF",
  sapphire: "#5BB8E8",
  green: "#6EE7A0",
  yellow: "#FFD666",
  peach: "#FF9E6B",
  red: "#FF6B8A",
  mauve: "#B07EFF",
  pink: "#FF7EB8",
  teal: "#5CE8D4",

  nodeDefault: "#3B82F6",
  nodeDefaultDark: "#2563EB",
  nodeActive: "#8B5CF6",
  nodeFound: "#3B82F6",
  nodeRemoving: "#FF6B8A",
  nodeError: "#FF6B8A",
  nodeNew: "#A855F7",
  arrowDefault: "rgba(255,255,255,0.92)",
  arrowActive: "#6E9BFF",
  highlightBar: "rgba(110, 155, 255, 0.14)",
  nullNode: "#4A4A6A",

  codeBg: "#08080E",
  dimmed: 0.3,
};

export const fonts = {
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'Inter', 'SF Pro Display', system-ui, sans-serif",
};

export const spacing = {
  nodeWidth: 130,
  nodeHeight: 56,
  nullWidth: 50,
  diagramPadding: 40,
  pointerStackOffset: 42,
};

export const springPresets = {
  enter: { damping: 12, stiffness: 100, mass: 0.8 },
  exit: { damping: 18, stiffness: 80 },
  snappy: { damping: 20, stiffness: 200 },
  slide: { damping: 22, stiffness: 150 },
  emphasis: { damping: 8, stiffness: 60, mass: 0.6 },
  gentle: { damping: 25, stiffness: 100 },
  transition: { damping: 16, stiffness: 120 },
  // Under-damped spring used for pointer translation. Lower damping + higher
  // mass gives a visible overshoot and 1–2 settle oscillations — this is what
  // drives the "pendulum swinging into place" feel for head / slow / fast.
  pointerMove: { damping: 10, stiffness: 140, mass: 0.9 },
} as const;
