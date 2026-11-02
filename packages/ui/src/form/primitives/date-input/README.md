# First-party date input experiment

Related to [Gutenberg #82177](https://github.com/WordPress/gutenberg/issues/82177). The earlier [React Aria experiment](https://github.com/WordPress/gutenberg/pull/86139) remains a separate draft.

This is a blocked first-party experiment. `DateInput` and `DateInputControl` are deliberately absent from the package entrypoint. Do not ship this implementation. Its tests retain failing Base UI acceptance assertions rather than marking the failures expected or skipping them.

## Question and result

Can separate native input segments, with first-party parsing and editing, retain existing WordPress `Field` composition and full Base UI `Field` and `Form` behavior?

Not with the adapter in this experiment. A visually hidden native `Field.Control` supplies canonical form values, labels, descriptions, native validity, and Base UI registration. Separate native inputs render the visible segments. Base UI still observes focus, blur, and incomplete edits on the hidden input rather than on those segments.

Removing React Aria does not solve this registration problem. Registering each segment as a `Field.Control` also does not register one logical date: Base UI retains one active logical control per field. The upstream investigation below found no supported replacement API in the installed release or the inspected upstream revision.

First-party editing does let this prototype retain impossible dates for validation. Complete public values use strict Gregorian `YYYY-MM-DD` strings from year 0001 through 9999. `undefined` selects uncontrolled mode, `null` is empty, and malformed strings including `''` throw. Locale affects display order, numerals, separators, and direction; it never changes canonical date semantics or reads WordPress settings.

## Reproduction

Open Storybook's **Components → @wordpress-ui → Form → Prototypes → DateInput**. `FieldComposition` uses unchanged WordPress `Field` markup, `InputControl` uses the labeled wrapper, and `BaseUiForm` displays the actual Base UI field state and submitted value.

1. Click a segment, edit it, and Tab through the remaining segments to Save. The field does not become touched, and blur validation does not run.
2. Reload and click the Date label. Focus reaches the first segment, but the hidden input's immediate blur marks the field touched while entering it.
3. Start with an empty value and enter only a month. The date is incomplete, but Base UI does not mark the field dirty or filled.
4. Enter February 30 and leave the editor. Day `30` and the original year remain visible, the date is invalid, and Save is blocked. This intentionally differs from React Aria's correction to February 28.
5. Clear both digits of a day and submit. Submission is blocked and focus reaches the editor. A single Backspace changes `20` to `2`; it does not clear the segment.

Run all recorded checks with:

```sh
npm run test:unit -- packages/ui/src/form/primitives/date-input/test
```

## Recorded evaluation

The final jsdom and Chromium run has 195 test cases: 188 passed and 7 failed. The retained failures cover focused state, filled state during partial editing, entering via a label, touched state on exit, partial-edit dirty state, and blur validation in jsdom and Chromium. These are behavior failures, not build failures. All 98 independent keyboard benchmark cases and all 48 parser cases pass. The existing calendar localization suite also passes all 38 cases.

The full repository build, package type check, JavaScript lint, CSS lint, and published-dependency audit pass. Firefox could not launch because its temporary profile was not found. WebKit's test connection closed before results were available, including on a separate retry after the build. Neither browser is recorded as verified. The temporary browser configuration was removed.

Passing coverage includes controlled rejection and external updates, `null`, uncontrolled changes, native reset and canceled reset, inherited disabled state, disabled native fieldsets, read-only behavior and focus, accessible labels and descriptions, server error propagation, canonical native and Base UI submission, required empty fields, and blocking incomplete or impossible drafts. Locale checks cover segment order for 17 locales, Arabic numerals/RTL, and localized paste. This sample is not evidence of complete locale or assistive-technology support.

The independent React Aria fixture imports no first-party parser, editor, or Base UI adapter. The benchmark compares emitted canonical values, segment values, and focused segments. Cases cover stepping and numeric replacement in 17 locales, Home/End/PageUp/PageDown, deletion, movement, and mixed key sequences. Separate parser cases cover leap-century rules, bounds, strict public values, invalid drafts, and localized paste.

`react-aria` 3.53.1, `react-stately` 3.51.0, and `@internationalized/date` 3.12.4 are development-only dependencies for the benchmark. The editor has no React Aria runtime dependency. The npm security audit during the initial experiment reported 53 findings in the repository dependency graph; none were attributed to its seven added packages. This does not mean the repository audit is clean. Bundle impact is not measured because no date component is exported or proposed for release.

## Upstream integration investigation

The installed Base UI version is 1.9.0. Its public field exports and `Field.Control` were also checked against upstream commit [`4e89b3adfa3ad773ffdf78aaa6aedfd1ccb46720`](https://github.com/mui/base-ui/tree/4e89b3adfa3ad773ffdf78aaa6aedfd1ccb46720/packages/react/src/field). Neither supplies a supported custom composite-control registration API.

- [#1996](https://github.com/mui/base-ui/issues/1996) recommends `Field.Control.render` for native controls such as a textarea. That element still has its own native value, validity, and focus lifecycle. It does not solve a multi-element editor with a separate canonical value.
- [#2306](https://github.com/mui/base-ui/issues/2306) remains open and discusses custom date controls and field-state access.
- [#4329](https://github.com/mui/base-ui/issues/4329) discusses context exports. The discussion favors narrow missing APIs over publishing internal context shapes. It does not provide a released adapter.

`Field.Root` can publicly control `dirty`, `touched`, and `invalid`, and `actionsRef.validate()` can request validation. These are insufficient to emulate the complete contract: `focused` and `filled` are not controlled props, the effective validation mode inherited from Base UI `Form` is not public context, and a WordPress-only context would not support direct Base UI `Field.Root` composition.

### Smallest proposed upstream contract

Prefer a supported adapter for one logical control over exporting the entire field context. Its owner should remain Base UI. The exact API name and shape need upstream design review; this is a proposal, not an available API.

The adapter needs separate references for native validity/submission and visible focus, a canonical logical value, an explicit draft-state notification, and semantic focus/blur notifications that do not read the value from an unrelated segment event. It must reuse Base UI's registration, initial-value comparison, inherited validation timing, server-error clearing, disabled-field exclusion, and invalid-submit focus. It must work under both WordPress and direct Base UI fields without consumer wiring.

Upstream verification should reuse the failing tests here and add validation inherited from `Form`, server errors during partial edits, reset/canceled reset, controlled rejection, disabled native fieldsets, unmount while focused, and ranges registered as one logical value. A separate focus target must not expose an extra tab stop or trigger validation merely when a label moves focus into the editor.

## Remaining implementation and acceptance plan

The prototype stops at the single-date integration boundary. The following remain required, not implicitly passed:

| Area | Required work |
| --- | --- |
| Shared field integration | Resolve the registration boundary before claiming Base UI compatibility. Keep one owner for field state and validation timing. |
| Public API | Separate DateInput/DateInputControl, DateRangeInput/DateRangeInputControl, and TimeInput/TimeInputControl. No combined datetime component or legacy migration in this work. Preserve refs, render composition, sizes, controlled/uncontrolled conventions, and cancellation semantics where applicable. |
| Values | Date-only ISO strings; local-time strings without implicit timezone conversion; range `{ from, to }` compatible with RangeCalendar's endpoint semantics. `undefined` means uncontrolled, `null` means controlled empty. Specify native and Base UI form serialization together. |
| Validation | Impossible dates, leap years including century rules, bounds, unavailable dates, required/optional partial drafts, custom/server errors, and no stale-value submission. Preserve invalid edits visibly. |
| Range editing | Two independently editable endpoints in one control; incomplete ranges; reverse order rejected; inclusive endpoints; same-day selection; constraints aligned with RangeCalendar. |
| Calendar popup | Existing Calendar/RangeCalendar plus optional chevron; keyboard opening, first-selection/completion behavior, Escape, outside dismissal, and focus return. Inline editing remains available. |
| Time | Segmented hours/minutes, optional seconds, localized day period/hour cycle, bounds, and custom validation. Never consult WordPress site settings. |
| Editing parity | Typing, digit-by-digit deletion, segment movement, arrows, Home/End, PageUp/PageDown, paste, composition/IME, and controlled rejection. Compare the first-party version to an independent React Aria fixture; document intentional differences such as impossible-date rejection. |
| Locale support | Locale-sensitive order, separators, numerals, RTL, hour cycle/day periods, accessible segment names, and translated errors. Gregorian date semantics must agree with the existing calendar. Representative tests do not justify restricting supported locales. |
| Forms | Native FormData and Base UI Form, all validation modes, dirty/touched/filled/focused, invalid submit focus, reset/canceled reset, server errors, disabled/read-only, and external controlled updates. |
| Browser and accessibility | Chromium, Firefox, WebKit, mobile input/IME, screen readers, forced colors, zoom/reflow, focus visibility, and touch targets. Reuse native-input CSS defenses and verify wp-admin's unlayered input styles. Compare semantics with the [APG spinbutton pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/). |
| Release | Bundle measurement, React 18/19 verification, declaration/runtime dependency checks, package exports/status documentation, and a changelog entry only when the components become a consumer-facing proposal. |

The implementation order is field integration first, then the single-date public contract, ranges, calendar popups, and time. Add the corresponding acceptance tests with each component. Locale support and accessibility are release requirements throughout this sequence, not optional follow-up features. Keep the independent React Aria benchmark for shared behavior and explicit tests for deliberate differences such as impossible-date rejection.

Programmatic `new FormData(form)` bypasses constraint validation and can still read the last canonical value while a draft is incomplete. Native validated submission and Base UI submission are the paths exercised here. The upstream design must settle invalid-draft serialization before release.

The adapter uses public Base UI APIs. It does not import private context, dispatch synthetic events, or substitute DOM properties to make the acceptance tests pass. Label/ref focus forwarding currently triggers the unwanted Base UI blur that the failing tests expose.
