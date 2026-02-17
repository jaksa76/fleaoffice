# Fleaoffice UI Guidelines

These guidelines define the design principles and patterns for all Fleaoffice applications. The goal is to create a minimalistic, elegant, and premium experience that prioritizes clarity, efficiency, and beauty.

Inspired by [GNOME Human Interface Guidelines](https://developer.gnome.org/hig/principles.html), these guidelines emphasize simplicity, consistency, and user-centered design.

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
- Use subtle animations and transitions (200ms duration is ideal)
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

### Grid System
- Use an 8px base grid for consistent spacing
- Common spacing values: 8px, 12px, 16px, 20px, 24px, 40px
- Containers have max-width constraints for readability (900-1200px)

### Whitespace
- Generous padding within components (minimum 12px)
- Clear separation between sections (20-40px)
- Don't crowd the interface—let content breathe

### Responsive Breakpoints
```
Mobile:  < 768px  (single column, simplified navigation)
Tablet:  768-1024px  (transitional layouts)
Desktop: > 1024px  (multi-column, expanded features)
```

---

## Typography

### Font Family
Use system fonts for optimal performance and native feel:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

### Type Scale
- **Headings (Page Title)**: 24-32px, font-weight 600-700
- **Subheadings**: 18-20px, font-weight 600
- **Body Text**: 15-16px, font-weight 400
- **Secondary Text**: 13-14px, font-weight 400
- **Small Text**: 12px, font-weight 400

### Line Height
- Headings: 1.2-1.3
- Body text: 1.5-1.6
- Compact lists: 1.4

### Letter Spacing
- Headings: -0.5px to -0.8px for larger sizes
- Body: default (0)

---

## Color Palette

### Primary Colors
```
Text Primary:   #2c3e50  (dark gray-blue)
Text Secondary: #666666  (medium gray)
Text Tertiary:  #999999  (light gray)
```

### Background Colors
```
Background:     #ffffff  (pure white)
Surface:        #f8f9fa  (very light gray)
Hover:          #f0f0f0  (light gray)
Border:         #e0e0e0  (soft gray)
```

### Accent Colors
```
Success:  #4CAF50  (green)
Error:    #d32f2f  (red)
Warning:  #ff9800  (orange)
Info:     #1976d2  (blue)
```

### Usage Guidelines
- Use color sparingly to draw attention
- Maintain 4.5:1 contrast ratio for text (WCAG AA)
- Don't rely solely on color to convey meaning
- Keep backgrounds neutral to let content shine

---

## Components

### Buttons

**Icon Buttons** (preferred for actions):
```css
width: 40px;
height: 40px;
border-radius: 8px;
transition: all 0.2s;
```
- Use icons without text labels when the meaning is clear
- Hover state: subtle background color (#f0f0f0)
- Active state: slight scale transform (0.95)

**Text Buttons** (use sparingly):
- Only when the action needs explicit labeling
- No heavy borders—use subtle background on hover

### Cards

```css
background: #ffffff;
border: 1px solid #e0e0e0;
border-radius: 12px;
padding: 16px;
transition: all 0.2s;
```
- Elevation on hover: `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`
- Keep card content minimal—title, metadata, preview only

### Input Fields

**Text Inputs**:
```css
border: none;
border-bottom: 1px solid #e0e0e0;
padding: 8px 0;
font-size: 16px;
```
- **Prefer placeholders to labels** whenever possible
- Use inline labels only when context is absolutely necessary
- Focus state: border color changes to accent color
- Full border only when needed for emphasis (like search boxes)

**Examples**:
```html
<!-- GOOD: Placeholder provides context -->
<input type="text" placeholder="Document title" />

<!-- ACCEPTABLE: Label needed for clarity -->
<label>Email Address</label>
<input type="email" placeholder="you@example.com" />

<!-- AVOID: Unnecessary redundancy -->
<label>Title</label>
<input type="text" placeholder="Enter title" />
```

### Navigation

- **Primary navigation**: Simple header with app name and essential actions
- **Back button**: Clear and always accessible (top-left on mobile)
- **Breadcrumbs**: Only for deep hierarchies
- Avoid hamburger menus on desktop

### Lists and Grids

**Lists**:
- Clean separation between items (border or spacing)
- Subtle hover states
- Right-aligned metadata/actions

**Grids**:
- Responsive: `repeat(auto-fill, minmax(280px, 1fr))`
- Gap between items: 16px
- Cards that expand on hover

---

## Interactive Patterns

### Transitions and Animations
- Use subtle, fast animations (150-250ms)
- Easing: `ease-out` for entering, `ease-in` for exiting
- Animate opacity, transform, and background-color
- Avoid animating layout properties (width, height)

### Hover States
- Always provide visual feedback
- Subtle color changes or background overlays
- Show contextual actions on hover (like delete buttons)
- Cursor changes to pointer for clickable elements

### Loading States
- Simple text messages: "Loading..." or spinner
- Skeleton screens for known layouts
- Progressive loading—show content as it arrives

### Empty States
- Friendly, helpful messages
- Clear call-to-action for getting started
- Centered, with adequate spacing

### Error States
- Clear, human-readable error messages
- Suggest solutions when possible
- Use color (red) but don't rely on it alone
- Position errors near the relevant component

---

## Forms and Data Entry

### Form Design Principles
1. **Single column layouts** for mobile and simple forms
2. **Placeholders over labels** to reduce visual clutter
3. **Auto-focus** first field when appropriate
4. **Inline validation** with immediate feedback
5. **Clear submit actions** (avoid generic "Submit")

### Field Types

**Text Input**:
- Placeholders describe expected input
- Auto-capitalize, auto-correct enabled appropriately
- Type attribute set correctly (email, url, tel, number)

**Date/Time Input**:
- Native controls on mobile
- Clear format hints in placeholder

**Checkbox/Toggle**:
- Clear on/off states with color and position
- Label to the right, aligned with checkbox

**Select/Dropdown**:
- Use native selects on mobile
- Custom dropdowns only when necessary
- Searchable for long lists

---

## Accessibility

### Keyboard Navigation
- All interactive elements accessible via Tab
- Visible focus indicators
- Escape key closes modals and overlays
- Enter key submits forms and activates primary actions

### Screen Readers
- Semantic HTML elements (header, nav, main, button, etc.)
- ARIA labels for icon-only buttons
- Alt text for all images
- Skip links for navigation

### Color and Contrast
- Maintain 4.5:1 contrast for text (WCAG AA)
- Don't rely solely on color for state or meaning
- Test in grayscale mode

### Touch and Click Targets
- Minimum 44×44px touch targets
- Adequate spacing between clickable elements (8px minimum)

---

## Platform Considerations

### Mobile Specific
- Safe area insets for notched devices
- Pull-to-refresh where appropriate
- Swipe gestures for common actions (delete, archive)
- Bottom sheets for secondary actions

### Desktop Specific
- Keyboard shortcuts (Ctrl+S for save, etc.)
- Context menus on right-click (when appropriate)
- Draggable elements for power users
- Wider layouts with multiple columns

### Progressive Enhancement
- Core functionality works without JavaScript
- CSS-only interactions where possible
- Graceful degradation for older browsers

---

## Performance

### Asset Optimization
- Use SVG for icons (crisp at any size, small file size)
- Optimize images (WebP format, appropriate sizes)
- Lazy load off-screen content
- Code splitting for large apps

### Perceived Performance
- Optimistic UI updates (assume success)
- Skeleton screens while loading
- Immediate visual feedback for actions
- Background data synchronization

---

## Writing and Microcopy

### Voice and Tone
- Clear and concise
- Friendly but professional
- Active voice
- Avoid jargon and technical terms

### Button Text
- Action-oriented verbs ("Save Document" not "Submit")
- Specific ("Delete Document" not "Confirm")
- Short (1-2 words ideal)

### Error Messages
```
❌ BAD:  "Error 404"
✅ GOOD: "Document not found"

❌ BAD:  "Invalid input"
✅ GOOD: "Please enter a valid email address"
```

### Empty States
```
❌ BAD:  "No data"
✅ GOOD: "No documents yet. Create your first document to get started."
```

---

## Implementation Checklist

When building a new component or screen, verify:

- [ ] Follows mobile-first approach
- [ ] Uses spacing from 8px grid system
- [ ] Typography matches scale and hierarchy
- [ ] Colors are from defined palette
- [ ] All interactive elements have hover states
- [ ] Touch targets are at least 44×44px
- [ ] Form inputs use placeholders when possible
- [ ] Animations are subtle and fast (200ms)
- [ ] Keyboard navigation works correctly
- [ ] Screen reader can access all content
- [ ] Text contrast meets WCAG AA standards
- [ ] Empty and error states are handled
- [ ] Loading states provide feedback

---

## Examples from Existing Apps

### Write App
The Write app exemplifies many of these principles:

✅ **Minimalistic toolbar** with icon-only buttons  
✅ **Clean card grid** for document list  
✅ **Generous whitespace** in editor  
✅ **Placeholder in title input** instead of label  
✅ **Subtle hover states** on cards and buttons  
✅ **Mobile-first responsive design**  
✅ **Clear visual hierarchy** in document cards  

---

## Further Reading

- [GNOME Human Interface Guidelines](https://developer.gnome.org/hig/principles.html)
- [Material Design Guidelines](https://material.io/design)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*These guidelines are living documents. As Fleaoffice evolves, update these guidelines to reflect new patterns and learnings.*
