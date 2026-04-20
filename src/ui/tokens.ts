// src/ui/tokens.ts
// (Keep your existing file if it already exists. Replace with this ONLY if yours differs.)

export const colors = {
    background: "#0f172a",
    surface: "rgba(255,255,255,0.05)",
    surface2: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.10)",

    textPrimary: "rgba(255,255,255,0.92)",
    textSecondary: "rgba(255,255,255,0.70)",

    primary: "#3b82f6",
    success: "#3DDC97",
    warning: "#F7C948",
    danger: "#FF5C73",
} as const;

export const spacing = {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
} as const;

export const typography = {
    fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    monoFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    size: { xs: 12, sm: 13, md: 14, lg: 16, xl: 18, xxl: 22 },
    weight: { regular: 500, semibold: 600, bold: 700 },
} as const;