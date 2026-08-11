# UI, interaction, accessibility, styles, and localization

Use this reference for component, editor UI, keyboard, focus, CSS, responsive,
animation, date/time, RTL, or translatable-string changes.

## Semantics and keyboard

- Give changed controls meaningful accessible names. Keep labels, tooltips,
  advertised shortcuts, and actions consistent; expose pressed, busy, disabled,
  destructive, and validation states accurately.
- Exercise affected flows with keyboard input alone. Verify Tab/Shift+Tab,
  pattern-specific arrows, Enter/Space, Escape, clearing keys, intermediate
  focus transitions, and the final action.
- Ignore keyboard events already consumed by a nested widget and IME composition
  events. Prevent the browser default only when the control performs its
  replacement action.
- When arrow-managed items leave the Tab sequence, use the appropriate composite
  role and one coherent focus model. Define the initial item, boundaries, and
  disabled-item behavior.
- For overlay changes, verify component choice and behavior. Use `Dialog` for a
  short, focused, context-light task with one primary action; `AlertDialog` for
  destructive or irreversible decisions; and `Drawer` for contextual editing,
  multiple sections, or drill-down flows. Do not nest dialogs. Test initial
  focus, dismissal, required containment, focus restoration, viewport behavior,
  and mobile expansion. For Popovers, also test anchoring and collision behavior.
- Announce meaningful dynamic updates through `@wordpress/a11y` when native
  semantics will not announce them. Prefer concise polite announcements and
  reserve assertive announcements for genuinely interruptive updates.

## Interaction states

- Treat editable-control values as raw input. Validate before committing to a
  constrained model, preserve required/empty semantics, and associate errors
  without replacing useful help text.
- For async mutations, prevent duplicate activation, set busy state before the
  await, show success only after settlement, surface the real error, and clear
  busy state in a `finally` path.
- Do not expose mutation controls until authoritative permissions and feature
  constraints resolve. Disallowed actions must be inert.
- For destructive changes, state what will be affected, confirm irreversible
  actions with explicit labels, and prevent repeated confirmation while pending.
  In a Drawer requiring explicit choice, omit the close icon and provide
  explicit Cancel and Confirm actions.
- Make consequential publication, placement, shared/global, structural, or
  reusable scope apparent before the edit completes.
- For RichText changes, cover no selection, ranges, collapsed carets, format
  boundaries, split/merge, empty values, and the complete resulting selection
  and format state.

## Visual and responsive behavior

- Verify changed UI with pointer and keyboard interaction and relevant focus,
  hover, active, disabled, and forced-colors states.
- Keep overlays fully within the viewport. Test anchor changes, placement,
  flipping, resizing, shifting, portal slots, narrow screens, overflow, and
  long content; do not combine incompatible positioning modes.
- Keep essential block controls available in the edit view or toolbar rather
  than only in the dismissible Settings Sidebar.
- Respect reduced-motion preferences; interaction availability must not depend
  on an animation completing.
- Scope component classes to their owner and use package/directory prefixes.
  Apply block wrapper APIs so editor, saved, and dynamic markup receive the
  intended generated classes.
- Classify block CSS correctly: `editorStyle` for editor-only, `style` for
  editor and frontend, and `viewStyle` for frontend-only. Account for iframe
  loading and verify existing blocks remain styled.
- For `theme.json` changes, check schema validity, core/theme/user precedence,
  inheritance, block support gates, generated preset names, and enqueued CSS.

## Internationalization

- Translate application-supplied visible and assistive strings with the owning
  text domain. Keep machine identifiers separate from localized labels.
- Keep source strings statically extractable. Use `_n`/`_nx` with the raw
  numeric count, `sprintf` with matching arguments, contextual `_x`/`_nx` when
  needed, and adjacent translator comments describing substitutions.
- Do not translate inside block `save`; render dynamic labels on the server or
  persist user-authored values.
- For date/time changes, define input, stored instant, and output timezone.
  Use `@wordpress/date` and test named site zones, fixed offsets, DST, locale
  formatting, and relevant calendar boundaries.
- Test direction-sensitive behavior in LTR and RTL. Derive UI direction from
  `@wordpress/i18n` and content direction from the relevant semantic element.
