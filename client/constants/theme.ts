import { Platform } from "react-native";

const primaryColor = "#dc2626";
const primaryDark = "#b91c1c";

export const Colors = {
  light: {
    text: "#111827",
    textSecondary: "#6b7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6b7280",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    primaryDark: primaryDark,
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#f9fafb",
    backgroundSecondary: "#f3f4f6",
    backgroundTertiary: "#e5e7eb",
    border: "#e5e7eb",
    statusPending: "#f59e0b",
    statusApproved: "#10b981",
    statusRejected: "#6b7280",
    statusOverdue: "#dc2626",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#dc2626",
    info: "#3b82f6",
  },
  dark: {
    text: "#f9fafb",
    textSecondary: "#9ca3af",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9ca3af",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    primaryDark: primaryDark,
    backgroundRoot: "#0f0f0f",
    backgroundDefault: "#1a1a1a",
    backgroundSecondary: "#262626",
    backgroundTertiary: "#374151",
    border: "#374151",
    statusPending: "#f59e0b",
    statusApproved: "#10b981",
    statusRejected: "#6b7280",
    statusOverdue: "#dc2626",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#dc2626",
    info: "#3b82f6",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
