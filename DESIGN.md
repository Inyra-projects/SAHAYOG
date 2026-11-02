---
version: 1.0.0
name: Sahayog-KRA-Design-System
description: "A precision healthcare performance intelligence platform built on a crisp slate-soft canvas (#f8fafc), layered frosted glass surfaces, hairline borders (#e2e8f0), and Sahayog's signature royal purple (#601DAF / #4A1282) paired with vibrant emerald health accents (#10b981). The design blends Linear's dense, technical software craftsmanship with Stripe's luminous ambient gradients and Apple's human-centric ergonomics. Data is presented through high-clarity tabular typography, weightless elevated cards, and contextual micro-interactions."

colors:
  primary: "#601DAF"
  primary-hover: "#7B2CBF"
  primary-deep: "#4A1282"
  primary-soft: "rgba(96, 29, 175, 0.08)"
  primary-glow: "rgba(123, 44, 191, 0.25)"
  
  canvas: "#F8FAFC"
  canvas-subtle: "#F1F5F9"
  surface: "#FFFFFF"
  surface-glass: "rgba(255, 255, 255, 0.85)"
  surface-hover: "#F8FAFC"
  
  ink: "#0F172A"
  ink-secondary: "#334155"
  ink-muted: "#64748B"
  ink-subtle: "#94A3B8"
  
  hairline: "rgba(15, 23, 42, 0.08)"
  hairline-strong: "rgba(15, 23, 42, 0.14)"
  hairline-glass: "rgba(255, 255, 255, 0.25)"
  
  status-emerald: "#10B981"
  status-emerald-soft: "rgba(16, 185, 129, 0.12)"
  status-amber: "#F59E0B"
  status-amber-soft: "rgba(245, 158, 11, 0.12)"
  status-rose: "#EF4444"
  status-rose-soft: "rgba(239, 68, 68, 0.12)"
  status-purple: "#8B5CF6"
  status-purple-soft: "rgba(139, 92, 246, 0.12)"

typography:
  display-hero:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: "-0.03em"
  display-lg:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.025em"
  heading-md:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: "-0.02em"
  heading-sm:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: "600"
    lineHeight: "1.35"
    letterSpacing: "-0.015em"
  body-md:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: "-0.01em"
  body-sm:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: "400"
    lineHeight: "1.45"
  body-tabular:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: "600"
    lineHeight: "1.2"
    fontVariantNumeric: "tabular-nums"
  caption:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "1.4"
  micro-caps:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: "600"
    textTransform: "uppercase"
    letterSpacing: "0.06em"

rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  pill: "9999px"

shadows:
  card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 6px 16px -2px rgba(15, 23, 42, 0.05)"
  card-hover: "0 12px 28px -4px rgba(15, 23, 42, 0.09), 0 4px 10px -2px rgba(0, 0, 0, 0.04)"
  dock: "0 20px 45px -8px rgba(74, 18, 130, 0.35), 0 8px 16px -4px rgba(0, 0, 0, 0.15)"
  glow: "0 0 24px rgba(123, 44, 191, 0.35)"

principles:
  weightlessness:
    - Floating cards resting on soft diffused shadows rather than harsh borders.
    - Subtle 3D lift on interactive elements (scale 1.008, translateY -2px) with spring dampening.
  spatial-depth:
    - Background ambient orbs providing spatial luminance without cognitive noise.
    - Frosted glassmorphism (backdrop-filter: blur(16px)) on floating controls and headers.
  density-and-clarity:
    - Strict avoidance of repeated data tokens.
    - Zero truncation on primary human names and critical identifiers.
    - Clear secondary metadata (Targets, Weights, Dates) paired using concise bullet separators (•).
  hicks-law:
    - Single-row horizontal scrollable filters instead of multi-tiered button stacks.
    - State-driven sticky action bars rendering only valid stage transitions.
---
