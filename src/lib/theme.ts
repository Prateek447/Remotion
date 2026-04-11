export const colors = {
  base: "#000000",
  mantle: "#050505",
  crust: "#000000",
  surface0: "#1e1e1e",
  surface1: "#282828",
  surface2: "#333333",
  overlay0: "#666666",
  text: "#e8e8e8",
  subtext0: "#999999",
  lavender: "#b4befe",
  blue: "#89b4fa",
  sapphire: "#74c7ec",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  peach: "#fab387",
  red: "#f38ba8",
  mauve: "#cba6f7",
  pink: "#f5c2e7",
  teal: "#94e2d5",

  nodeDefault: "#2196F3",
  nodeDefaultDark: "#1A7AD4",
  nodeActive: "#2E7D32",
  nodeFound: "#4CAF50",
  nodeRemoving: "#f38ba8",
  nodeError: "#f38ba8",
  nodeNew: "#9C6ADE",
  arrowDefault: "rgba(255,255,255,0.85)",
  arrowActive: "#89b4fa",
  highlightBar: "rgba(137, 180, 250, 0.18)",
  nullNode: "#8899aa",

  codeBg: "#0c0c0c",
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
} as const;
