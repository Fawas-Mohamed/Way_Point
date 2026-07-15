# Waypoint — Design System

## Concept

Waypoint treats a project as a journey and a milestone as a waypoint on its
route. This isn't a naming gimmick — it drives one concrete, structural
decision: progress is never shown as a generic bar or donut chart anywhere in
the product. It's shown as a **route line** — a thin path with nodes that
fill in as work completes. That's the one signature element the whole
interface is built around; everything else stays quiet so that element reads
as intentional rather than decorative.

## Color

| Token           | Hex       | Role                                          |
|-----------------|-----------|------------------------------------------------|
| Indigo Deep     | `#3730A5` | Brand, primary actions, active nav state        |
| Ink Slate       | `#1B2036` | Primary text, dark surfaces                     |
| Slate Mid       | `#64748B` | Secondary text, captions, placeholders          |
| Emerald Route   | `#0F9D6E` | Progress, success, "on track" states            |
| Amber Signal    | `#D97706` | Warnings, "at risk" states, due-soon             |
| Ember Red       | `#DC2626` | Errors, overdue, destructive actions            |
| Cloud           | `#F6F7FA` | App background                                  |
| Paper           | `#FFFFFF` | Card / surface background                       |
| Border          | `#E4E7EC` | Hairline dividers, card borders                 |

No neon, no gradients used as a crutch — the one gradient in the whole
system is a 6°, low-contrast indigo→transparent wash used once, behind the
landing page hero, and nowhere in the application itself.

## Typography

- **Fraunces** (serif, variable weight) — used only for: the landing page
  hero, the dashboard's personal greeting ("Good morning, Priya"), and page
  titles on Project Details. It carries the brand's personality precisely
  because it appears rarely.
- **Inter** — every other UI surface: nav, buttons, forms, table cells, body
  copy. Chosen for legibility at small sizes across the density this app
  needs (task tables, Kanban cards).
- **JetBrains Mono** — task IDs (`WAY-2481`), timestamps, and file sizes.
  Signals "this is data" versus "this is prose" without needing a label.

Type scale (8px baseline grid throughout):

| Role        | Size / Line height | Weight | Face      |
|-------------|---------------------|--------|-----------|
| Display     | 48px / 56px         | 500    | Fraunces  |
| H1          | 32px / 40px         | 600    | Fraunces  |
| H2          | 24px / 32px         | 600    | Inter     |
| H3          | 18px / 28px         | 600    | Inter     |
| Body        | 15px / 24px         | 400    | Inter     |
| Caption     | 13px / 20px         | 500    | Inter     |
| Data/Mono   | 13px / 20px         | 500    | JetBrains Mono |

## Layout concept

- **Dashboard**: not a grid of equal-sized stat cards. One large "Focus"
  panel (the single most time-sensitive thing — next deadline or a blocked
  task) sits left, at roughly 60% width; a narrow vertical activity/timeline
  strip sits right. Below, project summaries sit in a horizontally
  scrollable "shelf," not a fixed grid — this also solves the real UX
  problem of an unbounded number of projects without pagination controls.
- **Projects view**: grouped shelves by status (Active / Planning / On Hold),
  each shelf a horizontal scroll, rather than one undifferentiated grid —
  status becomes spatial, not just a filter chip.
- **Kanban**: columns are not equal width — the column matching the
  project's current bottleneck (computed from task counts) is visually
  wider, drawing the eye to where attention is needed.

## Signature element: the route line

A horizontal (or vertical, in the activity strip) line with small circular
nodes. Completed segments render in Emerald Route; the current position
renders as a slightly larger filled node with a soft outer ring; remaining
segments render as a dotted line in Border gray. Used for:

- Project progress (replacing a progress bar)
- Milestone sequences on Project Details (replacing a generic timeline
  component)
- Onboarding / multi-step forms (replacing a numbered stepper)

## Spacing & shape

- 8px base spacing unit throughout (`4, 8, 12, 16, 24, 32, 48, 64`).
- Corner radius: `8px` for inputs/buttons, `16px` for cards, `24px` for
  modals — soft but not pill-shaped, per the brief's "soft rounded corners."
- Shadows are single, soft, and low-opacity (`0 1px 2px rgba(27,32,54,0.04),
  0 4px 12px rgba(27,32,54,0.06)`), never stacked or dark — cards should feel
  lifted a millimeter off the page, not floating.

## File

Open `design-system/style-guide.html` directly in a browser — no build step
— to see the palette, type scale, and the route-line signature element
rendered.
