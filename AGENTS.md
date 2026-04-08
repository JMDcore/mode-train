<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Mode Train Design System

- Treat Mode Train as a premium mobile-first product: dark base, restrained surfaces, purple only as the accent, and generous spacing. Avoid noisy gradients, busy copy, and decorative UI that does not help actionability.
- Reuse the foundations already defined in `src/app/globals.css`: CSS variables in `:root` are the source of truth for colors, lines, text opacity, shadows, and accent behavior. Do not hardcode new colors unless a token is missing.
- Typography lives in `src/app/layout.tsx`. `Sora` is for headings and product moments; `Manrope` is for interface copy; `JetBrains Mono` is reserved for code or data-oriented fragments.
- Prefer existing component zones before inventing new ones:
  - `src/components/app-shell/` for shell and dashboard UI
  - `src/components/auth/` and `src/components/onboarding/` for access/profile flows
  - `src/components/training/` for workout, routine, history, and progress UI
- Styling approach: this project uses global CSS classes plus design tokens, not component-scoped CSS modules or inline utility soup. Extend the existing class system in `globals.css` when adding new view patterns.
- Components should stay visually quiet and highly legible: fewer words, stronger icons, simple CTA hierarchy, and dense information grouped into cards that are easy to scan one-handed on mobile.
- Buttons and interaction hierarchy:
  - `primary-button` for the single main action in a block
  - `secondary-button` for strong but non-primary actions
  - `ghost-button` for low-emphasis navigation or destructive-adjacent actions
- Form rules:
  - Inputs, selects, and textareas must use the shared field styling already defined in `globals.css`
  - Keep labels short and obvious
  - Prefer stacked mobile layouts over clever compact arrangements when clarity suffers
- Motion rules:
  - Use `motion/react` sparingly and intentionally
  - Favor subtle opacity, translate, and blur transitions
  - Avoid ornamental animation loops beyond the ambient background treatment
- Figma workflow rules for this repo:
  - Use Figma as reference, system alignment, and handoff support
  - Start by inspecting with `get_design_context` and `get_screenshot` when implementing a Figma node
  - Translate Figma output into this repo's class-based styling and token system rather than copying raw utility output
  - Preserve the project's mobile-first information density and avoid importing new UI kits or icon packs
- Asset rules:
  - Use `lucide-react` for icons already present in the codebase
  - Do not add a new icon package just for one screen
  - Store future product assets under `public/` if they must ship with the app
- Quality bar:
  - Every visual change should pass `npm run lint` and `npm run build`
  - For core flows, keep Playwright coverage current in `tests/e2e/`
