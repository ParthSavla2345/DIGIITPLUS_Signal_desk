# SignalDesk Design System & UI Specification

Extracted directly from the official **Stitch project (`projects/5260736139288526615`) - SignalDesk Incident Intelligence Platform**.

---

## 1. Color Palette

The color system is engineered for high-stakes technical environments to minimize cognitive fatigue during prolonged monitoring while providing high-signal accents for machine intelligence and critical incidents.

### 1.1 Brand & Accent Colors
| Token | Hex | Role / Usage |
| :--- | :--- | :--- |
| `primary` | `#c3c0ff` | Light lavender accent for headings, primary text highlights, and active icons |
| `primary-container` | `#4f46e5` | Core Indigo primary accent for primary CTAs, active badges, and hero actions |
| `on-primary-container` | `#dad7ff` | High-contrast text on primary container buttons and badges |
| `on-primary` | `#1d00a5` | Text contrast on solid primary |
| `inverse-primary` | `#4d44e3` | Hover / active states for primary buttons |
| `secondary` | `#c0c1ff` | Soft periwinkle for secondary metrics, info logs, and resolved indicators |
| `secondary-container` | `#3131c0` | Deep blue container for secondary elements |
| `on-secondary-container` | `#b0b2ff` | Text on secondary container |
| `tertiary` | `#ffb695` | Warm amber/coral for warnings, medium severity (P3), and knowledge base items |
| `tertiary-container` | `#a44100` | Deep amber container for tertiary badges |
| `error` | `#ffb4ab` | Coral red for critical states (P1, P2, SEV-1, connection drops, error logs) |
| `on-error` | `#690005` | Dark contrast text for error surfaces |
| `error-container` | `#93000a` | Deep crimson container |
| `on-error-container` | `#ffdad6` | Light text on error container |

### 1.2 Surface & Elevation Tokens (Tonal Layering)
| Level / Token | Hex | CSS Variable / Tailwind | Description |
| :--- | :--- | :--- | :--- |
| **Level 0 (Canvas Base)** | `#0B0E14` / `#031427` | `bg-background` / `bg-level-0` | The lowest application canvas background |
| **Level 1 (Surface Containers)** | `#151921` / `#0b1c30` | `bg-surface` / `bg-surface-container-low` | Primary sidebar, headers, and section containers |
| **Level 2 (Elevated Surfaces)** | `#1C212B` / `#102034` | `bg-surface-container` / `bg-level-2` | Interactive cards, modal dialogs, and table headers |
| **Level 3 (High Elevation)** | `#1b2b3f` / `#26364a` | `bg-surface-container-high` / `bg-surface-container-highest` | Hover overlays, active list items, tag chips |
| **Borders & Outlines** | `#2D333B` / `#464555` | `border-outline-variant` / `border-[#2D333B]` | 1px solid structural container borders |
| **Subtle Outlines** | `#918fa1` | `border-outline` | Focus states, secondary borders |

### 1.3 Text & Content Tokens
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `on-surface` | `#d3e4fe` | Primary reading text (high contrast, soft blue-white) |
| `on-surface-variant` | `#c7c4d8` / `#918fa1` | Secondary labels, timestamps, metadata, and placeholder text |
| `on-background` | `#d3e4fe` | Canvas body text |

---

## 2. Typography

The typography strategy pairs a modern geometric grotesque font for general interfaces with a technical monospaced font for machine data, logs, IDs, and status metrics.

- **Primary / Body Font:** `Geist`, `Inter`, `sans-serif`
- **Technical / Monospace Font:** `JetBrains Mono`, `monospace`
- **Iconography:** `Material Symbols Outlined` (Google Fonts)

---

## 3. Font Sizes and Weights

| Token | Family | Size | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Geist | `48px` | `56px` | `600` (SemiBold) | `-0.02em` | Large metric highlights, hero numbers |
| `headline-lg` | Geist | `32px` | `40px` | `600` (SemiBold) | `-0.01em` | Desktop view titles (Dashboard, Incidents) |
| `headline-lg-mobile` | Geist | `24px` | `32px` | `600` (SemiBold) | `0` | Mobile view titles |
| `headline-md` | Geist | `24px` | `32px` | `500` (Medium) | `0` | Section headings, panel titles |
| `body-lg` | Geist | `18px` | `28px` | `400` (Regular) | `0` | Featured descriptions |
| `body-md` | Geist | `16px` | `24px` | `400` (Regular) | `0` | Default body text, descriptions, cards |
| `body-sm` | Geist | `14px` | `20px` | `400` (Regular) | `0` | Compact incident details, table contents, logs |
| `label-md` | JetBrains Mono | `13px` | `16px` | `500` (Medium) | `0.02em` | Button text, incident IDs, navigation links |
| `label-sm` | JetBrains Mono | `11px` | `14px` | `500` (Medium) | `0.04em` | Status badges, timestamps, table headers, tags |

---

## 4. Spacing System

Built on a **4px baseline grid** (`unit: 4px`):

| Token | Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| `unit` | `4px` | `p-1`, `gap-1`, `mb-unit` | Micro-gaps, badge padding |
| `stack-sm` | `8px` | `p-stack-sm` (`p-2`) | Inner element gap, compact rows |
| `stack-md` | `16px` | `p-stack-md` (`p-4`) | Standard card padding, grid gaps |
| `stack-lg` | `24px` | `p-stack-lg` (`p-6`) | Section spacing, hero container padding |
| `gutter` | `16px` | `gap-gutter` | Standard layout gutter |
| `margin-mobile` | `16px` | `px-margin-mobile` | Mobile screen outer edge padding |
| `margin-desktop` | `24px` | `px-margin-desktop` | Desktop screen outer edge padding |

---

## 5. Border Radius

- `sm`: `0.25rem` (`4px`) — Log items, inline code tags, compact pills
- `DEFAULT` / `md`: `0.5rem` (`8px`) — **Standard** for all cards, containers, inputs, and buttons
- `lg`: `0.5rem` (`8px`) — Grid cards, dropdown menus
- `xl`: `0.75rem` (`12px`) — Primary hero cards, modal dialogs, timeline containers
- `full`: `9999px` — Circular badges, avatar chips, status dots

---

## 6. Shadows & Glows

Hierarchy is primarily achieved through **Tonal Layering and Borders (`1px solid #2D333B`)**, augmented with high-tech radial and inner glow effects for AI components:

- **Metric Card Border:** `border: 1px solid #2D333B`
- **AI Card Glow (`.ai-glow`):** `box-shadow: inset 0 0 20px rgba(79, 70, 229, 0.15);`
- **AI Ambient Glow:** Radial gradient `radial-gradient(circle at 100% 50%, rgba(79, 70, 229, 0.05) 0%, transparent 50%)`
- **AI Insight Shadow:** `box-shadow: 0 0 15px rgba(79, 70, 229, 0.1)`
- **Modal / Floating Drop Shadow:** `shadow-[0_8px_30px_rgb(0,0,0,0.12)]`
- **Progress Ring / Pulse Animation:** Radial ripple pulsing outward (`opacity: 0.5 -> 0`, `scale: 0.8 -> 1.5`)
- **Shimmer Text:** Linear gradient `90deg, #c3c0ff 0%, #ffffff 50%, #c3c0ff 100%` with infinite horizontal keyframe sweep.

---

## 7. Background Colors & Hierarchy

1. **Window / Body Canvas:** `#0B0E14` (Level 0) or `#031427` (Dark Navy Base)
2. **Side Navigation & Headers:** `#0b1c30` / `#151921` (Level 1)
3. **Cards & Content Blocks:** `#102034` / `#1C212B` (Level 2)
4. **Nested Code / Log Displays:** `#000f21` / `#0B0E14` (Level 0 hollowed inset)

---

## 8. Sidebar Design

- **Desktop Placement:** Fixed left, width `w-60` (`240px`), full viewport height, `border-r border-outline-variant` (`#464555` / `#2D333B`).
- **Brand Header:** `h-16` / `p-6` with Material Icon (`hub` or `signal_cellular_alt`) in `#c3c0ff` and title `SignalDesk AI` in `Geist 500`.
- **Navigation Links:**
  - Standard Item: `mx-2 my-1 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg font-label-md`
  - Active Item: `bg-primary-container (#4f46e5) text-on-primary-container rounded-lg font-label-md`
- **Mobile Navigation:** Bottom navigation bar fixed at bottom (`h-16`), `bg-surface-container`, `border-t border-outline-variant`, displaying 4 icon + label actions (`Dash`, `Incidents`, `KB`, `Create`).

---

## 9. Dashboard Layout

- **Top Bar:** Fixed `h-16`, docked header with breadcrumbs/title, global search button, and user profile avatar bubble.
- **Header Summary:** `SignalDesk Dashboard` with subtitle `AI-powered incident intelligence`.
- **Key Metrics Grid (6 Columns):**
  - Columns: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-stack-md`
  - Cards: Total Incidents (with trend `+12%`), Open (`error`), In Progress (`secondary`), Resolved (`primary`), P1/P2 (`error`), Anomalies (`tertiary`).
  - Card style: `bg-surface border border-[#2D333B] rounded-lg p-stack-md flex flex-col gap-2`
- **AI Intelligence Banner / Anomaly Alert:**
  - Hero container with `ai-glow`, `auto_awesome` icon, title `X Potential Anomalies Detected`, cluster summary (e.g. `8 similar incidents`, `Active for 42 min`), and primary CTA button `Investigate`.
- **Recent Incidents Table Card:** Embedded card with table header, status dots, and "View All" link.

---

## 10. Incident Table Design

- **Container:** `bg-surface border border-[#2D333B] rounded-lg overflow-hidden`
- **Header:** `bg-surface-container-low font-label-sm text-on-surface-variant uppercase border-b border-[#2D333B]`
  - Columns: `ID`, `Incident`, `Priority`, `AI Confidence`, `Evidence`
- **Row Styling:**
  - `border-b border-[#2D333B] hover:bg-surface-container-low transition-colors font-body-sm`
  - ID rendered in `font-label-md text-on-surface-variant`
  - Title rendered in `font-medium text-on-surface`
  - Priority badge: `inline-flex items-center gap-1 bg-error/10 text-error px-2 py-0.5 rounded border border-error/20` with a `1.5` x `1.5` filled circle dot.
  - Confidence: `text-primary font-label-md`
  - Evidence label: `text-on-surface-variant`

---

## 11. Incident Detail Layout

A 3-column / 12-column grid layout (`max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6`):

1. **Left Column (5 columns) — Context & AI Triage:**
   - **Summary Card:** Description, Created timestamp, Affected Service, Assigned Team.
   - **AI Investigation Card:** Probable Causes with confidence bars, Recommended Actions with action chevrons.
   - **Low Evidence State Demo Card (Hallucination Guard):** Border dashed, opacity 60%, warning badge.
2. **Middle Column (4 columns) — Evidence Visualization:**
   - **Evidence Strength Card:** Centered circular SVG radial gauge (0-100), `HIGH EVIDENCE` pill badge, supporting summary.
   - **Supporting Evidence List:** Cards for `RESOLVED INCIDENT` (secondary accent) and `KB ARTICLE` (tertiary accent) with relative timestamps and relevance links.
3. **Right Column (3 columns) — Timeline & Engineer Actions:**
   - **Investigation Timeline:** Vertical connected timeline with icon node badges.
   - **Note Input Panel:** Input for engineer comments and action buttons (`Re-analyze`, `Assign to me`, `Resolve`, `Escalate`).

---

## 12. AI Investigation Cards

- **Visual Signature:** Outer border `border-primary-container/30` with `bg-surface`, top-right ambient blur glow (`bg-primary-container/20 filter blur-[80px]`), and header `temp_preferences_custom` icon.
- **AI Suggested Badge:** `px-2 py-1 rounded bg-surface-container border border-surface-variant font-label-sm text-primary flex items-center gap-1`
- **Probable Causes Item:**
  - High confidence: Inset card (`bg-background border border-surface-variant`) with solid `4px` left border (`bg-primary-container`), large percentage text (`24px` Geist SemiBold), and description.
  - Lower confidence: Compact inset card with `bg-outline-variant` indicator.
- **Recommended Action Item:**
  - Full-width button with `hover:bg-surface-container transition-colors`, left title, and `chevron_right` icon.

---

## 13. Evidence Strength Visualization

- **Radial Gauge Component:**
  - Dimensions: `160px` x `160px` (`w-40 h-40`) SVG
  - Background circle track: `stroke: text-surface-variant` with `stroke-width: 6`, `r: 42`
  - Progress Arc: `stroke: text-primary-container` with `drop-shadow: 0 0 8px rgba(79, 70, 229, 0.5)`
  - Center Display: Large score `88` (`font-display-lg text-[40px] leading-none`) over denominator `100` (`font-label-sm text-on-surface-variant`) separated by a subtle divider.
- **Evidence Level Badge:**
  - High: `bg-primary/10 text-primary border border-primary/20` (`HIGH EVIDENCE`)
  - Moderate: `bg-tertiary/10 text-tertiary border border-tertiary/20` (`MODERATE EVIDENCE`)
  - Low: `bg-error/10 text-error border border-error/20` (`LOW EVIDENCE`)

---

## 14. Anomaly Visualization

- **Dashboard Alert Banner:**
  - Border `border-outline-variant` with inset indigo glow
  - Icon `auto_awesome` in `#c3c0ff`
  - Title: `7 Potential Anomalies Detected`
  - Subtitle: `Top concern: VPN authentication cluster`
  - Metadata badges: `bg-surface-container-high px-2 py-1 rounded font-label-sm text-on-surface-variant`
- **Timeline Anomaly Event:**
  - Node dot: `bg-error/20 border border-error/30 text-error` with `warning` icon
  - Inset box: `border-l-2 border-l-error` with highlighted incident cluster count.

---

## 15. Timeline Component

- **Structure:** Connected vertical line using `w-0.5 bg-surface-variant` with timeline nodes positioned on the left (`pl-8 pb-6 relative`).
- **Nodes:**
  - AI Triage: `w-6 h-6 rounded-full bg-primary-container/20 border border-primary-container/30 text-primary` (`smart_toy` icon)
  - Cluster / Anomaly: `w-6 h-6 rounded-full bg-error/20 border border-error/30 text-error` (`warning` icon)
  - Retrieval / Knowledge: `w-6 h-6 rounded-full bg-secondary/20 border border-secondary/30 text-secondary` (`search` icon)
  - Engineer Note / Comment: Avatar bubble / user icon node with comment bubble below in `bg-surface-container`.
- **Timestamps:** `font-label-sm text-label-sm text-on-surface-variant` (e.g., `10:02:14 AM`).

---

## 16. Buttons

| Variant | Styling | States |
| :--- | :--- | :--- |
| **Primary Button** | `bg-primary-container (#4f46e5) text-white font-label-md px-4 py-2 rounded shadow-[0_4px_12px_rgba(79,70,229,0.15)]` | Hover: `brightness-110` / `bg-inverse-primary` |
| **Secondary / Ghost Button** | `bg-level-2 (#1C212B) border border-border-color (#2D333B) text-on-surface font-label-md px-4 py-2 rounded` | Hover: `bg-surface-container-high` |
| **Danger / Escalate Button** | `border border-surface-variant text-on-surface font-label-md px-4 py-2 rounded` | Hover: `bg-error/10 text-error border-error/30` |
| **Resolve Button** | `bg-primary-container text-on-primary-container font-label-md px-4 py-2 rounded` | Hover: `brightness-110` |

---

## 17. Badges (Subtle Fill + Dot Pattern)

All status badges follow the **Subtle Fill + Dot** pattern:

- **Format:** `px-2 py-0.5 rounded border text-[11px] font-label-sm flex items-center gap-1.5`
- **P1 (Critical):** `bg-error/20 text-error border-error/30 font-bold` + red dot `w-1.5 h-1.5 bg-error`
- **P2 (High):** `bg-error/10 text-error border-error/20` + red dot `w-1.5 h-1.5 bg-error`
- **P3 (Medium):** `bg-tertiary/10 text-tertiary border border-tertiary/20` + amber dot `w-1.5 h-1.5 bg-tertiary`
- **P4 (Low):** `bg-surface-container-highest text-on-surface-variant border border-outline-variant`
- **Status - Open / In Progress:** `bg-primary-container/10 text-primary border border-primary-container/20`
- **Status - Resolved:** `bg-secondary/10 text-secondary border border-secondary/20`

---

## 18. Forms & Inputs

- **Input Fields:**
  - Background: `bg-level-0` / `bg-[#0B0E14]` (darker than containing card for inset depth)
  - Border: `1px solid #2D333B` / `border-border-color`
  - Font: `font-label-md` / `font-body-sm text-on-surface`
  - Focus: `focus:border-primary focus:ring-1 focus:ring-primary outline-none`
  - Placeholder: `placeholder-on-surface-variant/50` / `placeholder:text-outline`
- **Search Bar with Filter Buttons:**
  - Embedded in `bg-level-1 border border-border-color rounded-lg p-stack-sm`
  - Filter pills: `px-3 py-1.5 rounded-md font-label-md text-label-md border` (e.g. `All Levels`, `Error Only`, `Warn`, `Info`).

---

## 19. Responsive Behavior

- **Mobile Viewport (`< 768px`):**
  - Global desktop sidebar hidden (`hidden md:flex`).
  - Fixed bottom navigation bar enabled (`md:hidden fixed bottom-0 left-0 w-full z-50`).
  - Top app bar includes mobile branding and menu toggle.
  - Multi-column grids collapse to 1 or 2 columns (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`).
  - Incident detail page stacks into a single vertical scroll stream.
- **Desktop Viewport (`>= 1024px` / `>= 1280px`):**
  - Permanent left navigation drawer (`w-60`).
  - 12-column grid layout for incident workspace (5 cols triage, 4 cols evidence, 3 cols timeline).
  - High-density log viewer and dual action headers.

---

## 20. Reusable Component Patterns

1. **`<MetricCard />`**: Compact counter with icon, change trend indicator, and title.
2. **`<AiTriageCard />`**: Incident classification card with `AI Suggested` badge, confidence bar, and team tags.
3. **`<AiInvestigationHero />`**: Hero section with ambient blur glow, causes breakdown, and action triggers.
4. **`<EvidenceStrengthRadial />`**: SVG circular gauge showing 0-100 evidence score with high/moderate/low classification.
5. **`<SupportingEvidenceCard />`**: Card representing historical resolved ticket or knowledge base article.
6. **`<InvestigationTimeline />`**: Vertical event log with categorized icon dots and expandable detail blocks.
7. **`<SubtleBadge />`**: Reusable status pill with 6px solid dot and transparent colored background.
8. **`<AiProgressModal />`**: Stepped progress tracker with pulsing radial rings and live scanning log output.
