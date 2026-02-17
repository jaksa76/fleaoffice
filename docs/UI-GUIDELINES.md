# Fleaoffice UI Guidelines (Condensed)

These guidelines define the design rules for all Fleaoffice apps: minimal, elegant, mobile-first, and consistent.

Inspired by GNOME HIG principles: https://developer.gnome.org/hig/principles.html

---

## Core Principles

### 1. Minimalism First
- Remove all unnecessary elements. Every component must justify its existence
- Prefer implicit affordances over explicit labels
- Use whitespace generously to create breathing room
- Less is more: choose quality over quantity in every design decision

### 2. Mobile First
- Design for small screens first, then scale up
- Touch targets must be at least 44×44px
- Ensure all interactions work on touch devices
- Test on real mobile devices regularly

### 3. Elegance and Premium Feel
- Use subtle animations and transitions (150-250ms, with 200ms as the sweet spot)
- Soft shadows for depth, not heavy borders
- Rounded corners (6-12px) for modern feel
- High contrast text for readability, but avoid harsh blacks

### 4. Clarity and Directness
- Clear visual hierarchy guides the user's attention
- One primary action per screen
- Immediate visual feedback for all interactions
- Error states are clear and actionable

---

## Layout & Spacing

- Use an 8px spacing grid (common: 8/12/16/20/24/40).
- Keep content breathable: component padding ≥ 12px; section separation 20–40px.
- Prefer readable containers (rough target: 900–1200px max width on desktop).

Breakpoints:
```
Mobile:  < 768px
Tablet:  768–1024px
Desktop: > 1024px
```

---

## Typography

Use system fonts for a native feel:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

Type scale (defaults):
- Page title: 24–32px, 600–700, line-height 1.2–1.3, slight negative tracking.
- Section heading: 18–20px, ~600.
- Body: 15–16px, ~400, line-height 1.5–1.6.
- Secondary: 13–14px.
- Small: 12px.

---

## Color Palette

Use only the core palette and keep backgrounds neutral.

```
Text Primary:   #2c3e50
Text Secondary: #666666
Text Tertiary:  #999999

Background:     #ffffff
Surface:        #f8f9fa
Hover:          #f0f0f0
Border:         #e0e0e0

Success:        #4CAF50
Error:          #d32f2f
Warning:        #ff9800
Info:           #1976d2
```

Rules:
- Use color sparingly; don’t rely on color alone.
- Maintain WCAG AA contrast (4.5:1 for text).

---

## Components

### Buttons

- Prefer icon buttons for frequent actions; use text labels only when ambiguous.
- Touch target: at least 44×44px (40×40px is a common visual size, with padding as needed).
- States: hover background, active press feedback, visible keyboard focus.
- Motion: 150–250ms transitions (200ms default), avoid flashy effects.

### Inputs

- Prefer placeholders over labels when context is obvious.
- Keep styling light: avoid heavy borders; use subtle separators.
- Show clear focus state; validate inline; errors should be actionable.

### Cards, Lists, Grids

- Cards: rounded corners (6–12px), soft border, subtle hover elevation.
- Lists: clean separation, subtle hover, actions aligned consistently (often right).
- Grids: responsive and roomy (e.g., `repeat(auto-fill, minmax(280px, 1fr))`).

### Navigation

- Simple header with app name + essential actions.
- Back button is always accessible on mobile.
- Avoid deep navigation; breadcrumbs only for genuine hierarchies.

---

## Interaction & States

Motion:
- Prefer animating opacity/transform/background-color.
- Avoid layout animations (width/height) unless essential.

Feedback:
- Hover/focus states for every interactive element.
- Loading: keep it simple (spinner/text) or skeleton for known layouts.
- Empty: friendly, brief, includes a single clear “get started” action.
- Error: plain language, next step included.

---

## Accessibility (Non-Negotiable)

- Keyboard: all actions reachable via Tab; focus is visible; Esc closes overlays.
- Screen readers: semantic HTML; ARIA labels for icon-only buttons; alt text for images.
- Touch: targets ≥ 44×44px; at least 8px spacing between tap targets.

---

## Writing & Microcopy

- Voice: concise, professional, human.
- Buttons: action verbs, specific, short (1–2 words when possible).
- Errors: name the problem and the fix.

Examples:
```
Bad:  "Error 404"
Good: "Document not found"

Bad:  "Invalid input"
Good: "Please enter a valid email address"
```

---

## Checklist

- Mobile layout works; touch targets meet 44×44px.
- One primary action per screen.
- Spacing follows the 8px grid; layout feels uncluttered.
- Typography matches the scale; hierarchy is obvious.
- Uses the palette; contrast meets WCAG AA.
- Hover/focus/active states exist for all controls.
- Loading/empty/error states are present and readable.
- Keyboard navigation works end-to-end.
- Screen reader essentials (labels/semantics) are in place.

---

## Reference

- The Write app is the baseline: minimal toolbar, clean cards, generous whitespace, subtle hover, placeholder-first inputs.
