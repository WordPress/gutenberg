# Single-date localized text input experiment

**Blocked. Do not export or ship this component.** Localized editing, ISO React values, and ISO native form values work in this prototype. Unpatched Base UI 1.9.0 still gives `Form.onFormSubmit` and `Field.validate` the displayed text. This does not meet the agreed integration contract.

This is the single-date investigation for [#82177](https://github.com/WordPress/gutenberg/issues/82177). Range inputs, time inputs, calendar popups, and their wrappers are outside this draft. The earlier segmented experiments remain in #86139 and #86140.

## Intended contract

`value`, `defaultValue`, `onValueChange`, constraints, native form values, and Base UI form values use Gregorian `YYYY-MM-DD` strings. `null` represents an empty React value; `undefined` selects uncontrolled mode. Empty native values serialize as `''`. Public empty strings and invalid ISO values are rejected. A complete date that violates a constraint can reach the callback, but validation prevents submission.

The editor uses numeric Gregorian dates in the supplied `locale`, with locale order, separators, and numerals. It uses the runtime locale when none is supplied, without reading WordPress settings. International calendar conversion is not implemented. For example, Thai editing uses localized Gregorian dates rather than Buddhist years. This is an explicit prototype limitation, not a claim of React Aria calendar parity or readiness for all WordPress locales.

The parser requires four year digits and two month/day digits. It accepts locale digits or ASCII digits, ignores Unicode direction marks, and accepts surrounding whitespace. It does not guess another locale, use `Date.parse` for user text, or normalize impossible dates. Unparseable drafts remain editable and serialize an empty native value rather than a stale date. Complete dates serialize their current ISO value even when constraints reject them. Native submission validates first; direct FormData reads do not validate. Read-only controls follow native behavior and submit their date without constraint validation. A locale change replaces a draft with the accepted value in the new format.

Changing only the locale currently marks the Base UI field dirty because its state follows the displayed text. This is another unmet integration requirement.

The forwarded ref targets the visible native input. Field labeling, descriptions, disabled state, focus, dirty, filled, touched, native validity, server errors, and reset use the existing input integration. `DateInputControl` uses the same label/description composition as `InputControl`.

## Verified integration gap

| Public composition | Native FormData | Base UI Form | Remaining failure |
| --- | --- | --- | --- |
| This prototype: localized Input plus hidden ISO value | ISO | Localized text | Field.validate also receives text. |
| Input with an ISO controlled prop and localized render override | ISO with a hidden input | Localized text | Submit validation gets ISO, but blur/Enter validation reads the displayed text. |
| Register a hidden canonical Field.Control | ISO | ISO | Label focus needs forwarding; unchanged canonical values do not track partial drafts or clear server errors. |
| Combobox selected ISO value plus localized inputValue | ISO | ISO | Partial edits do not mark the field dirty/filled. Draft objects would leak into Field.validate. |

`Field.Control` registers a getter that reads the referenced input's `.value`, and `Form.onFormSubmit` calls that getter. Controlled registration values and editable DOM values cannot be given separate public serializers. The internal registration API is not exported. A hidden input fixes native serialization but does not alter Base UI's registered getter.

This is missing public custom-control support, not a demonstrated defect in ordinary Base UI Input behavior. The next upstream discussion should cover separate logical value, editable draft/state, serialization, and focus/validation targets. No Base UI files or dependency versions are changed here. DOM-value interception, private imports, and submit-time value swaps are deliberately absent.

## Verification

The `BLOCKED:` tests use Vitest `it.fails` to execute the desired ISO assertions and record known unmet requirements. They are not skipped. A test run that succeeds still means these requirements failed as expected; it does not make this draft viable. Remove `fails` to see the direct failures. An unexpected success also fails the test suite and requires reviewing the blocker.

`localized-contract.jsdom.test.tsx` isolates the public Base UI alternatives. `localized-input.jsdom.test.tsx` checks the actual prototype, including its unmet form and custom-validation contracts. Other tests cover ISO-locale behavior, localized parsing and numerals, native submission, invalid dates and bounds, reset and reassociation, cancellation, controlled values, WordPress validation, and browser keyboard interactions.

Storybook: **Components → @wordpress-ui → Prototypes → Date text input**. The Base UI form story shows the React value, native FormData, and actual Base UI submission side by side. The Native validation story demonstrates localized errors and ISO submission through the WordPress wrapper.

Passing isolated tests and screenshots do not establish screen-reader, mobile, editor, or full locale coverage. This prototype remains blocked before package exports or consumer adoption.
