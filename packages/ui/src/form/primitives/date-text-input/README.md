# Date text input prototype

This is an unexported alternative for [#82177](https://github.com/WordPress/gutenberg/issues/82177). Each date, range, or time is edited in one native text input. `@wordpress/ui` Input supplies the existing Base UI Field/Form integration. Calendar selection uses the existing Calendar or RangeCalendar inside Popover. No Base UI patch, private context, React Aria dependency, or WordPress settings are required.

## Formatting decision

This draft deliberately makes the displayed text equal to the canonical form value. Dates use ASCII Gregorian `YYYY-MM-DD`, ranges use `YYYY-MM-DD/YYYY-MM-DD`, and times use 24-hour `HH:mm` or `HH:mm:ss`. The `locale` prop affects the calendar only. It does not change the input's order, separators, numerals, or time format. This is an additional compromise beyond replacing segmented editing. It needs product agreement before shipping.

A localized text input could still use the same Base UI registration, but Base UI Form would then receive localized text. Returning canonical data from that form would require an explicit conversion contract. A hidden canonical input alone does not change the value Base UI registers for the visible control. This prototype does not promise that conversion.

## Components and values

| Component | Public value | Native/Base UI form value |
| --- | --- | --- |
| `DateInput` | ISO date string or `null` | ISO date string or `''` |
| `DateRangeInput` | `{ from: string \| undefined, to?: string }` or `null` | ISO interval string or `''` |
| `TimeInput` | Local time string or `null` | Local time string or `''` |

`value={ undefined }` means uncontrolled. `null` means empty. Use `defaultValue` for an uncontrolled initial value. Empty strings are not public date/time values. Invalid public values and invalid bounds throw a `RangeError`; invalid typed drafts stay visible for correction. A range may have one complete endpoint, matching RangeCalendar's partial-selection contract. An entirely empty range uses `null`.

`onValueChange` receives parsed values, partial ranges, or `null` when cleared. It does not fire for an incomplete or impossible date/time draft. Parsed values can still violate bounds, availability, or range ordering; those errors block submission. The details object identifies typing or calendar selection and provides `cancel()`. Controlled consumers can also reject a change by retaining their value. Rejected complete changes restore the accepted value. Incomplete drafts remain editable until replaced, cleared, reset, or superseded by a different controlled value.

`min` and `max` are inclusive. `isDateUnavailable` uses ISO dates. For ranges, availability applies to the endpoints; an unavailable date inside a range does not invalidate it. Time bounds use the selected precision and cannot wrap across midnight. Dates carry no time zone; times carry no date or offset. UTC is used only when adapting date-only strings to the Calendar's Date objects.

`showCalendar` defaults to false. Both date components support a calendar button alongside inline editing. The calendar uses the same date constraints. A partial range keeps the popup open; a complete selection closes it. Escape returns focus to the input. Outside dismissal preserves the clicked target's focus. Calendar labels, RTL direction, and week conventions come from the existing calendar. Text is always left-to-right so ISO values remain readable in an RTL form.

`DateInputControl`, `DateRangeInputControl`, and `TimeInputControl` add the same Field label, description, and details composition as InputControl. Forwarded refs point to the actual native input. Standard `render`, input names, required, disabled, read-only, form association, and native input events remain available. `onValueChange` also covers calendar selection; native `onChange` describes text-input events.

## Validation and forms

The visible input owns native `setCustomValidity` for date/time parsing and constraints. There is no hidden last-valid-value control. Native submission and Base UI Form submission reject incomplete, impossible, out-of-bounds, unavailable, and reversed drafts. Native FormData construction does not validate: if called directly while the input is invalid, it returns the current draft. Consumers must use the form's validation before treating submitted text as canonical.

Base UI owns label/description association, focus, dirty, touched, validation timing, custom validation, and server errors. Its state describes the native text input. Moving from the input to its calendar button blurs the input, just as moving to an auxiliary button in another text control does. The prototype does not redefine Field focus as focus anywhere inside the calendar.

For additional validation, use Base UI Field's `validate` or Form's `errors`. The WordPress `ControlWithError` wrapper can observe the date control's own validity without clearing it. This draft fixes the wrapper's unconditional clearing when `customValidity` is omitted. Explicit `ControlWithError.customValidity` still takes ownership of the native error slot and must not be combined with this input's independent validator.

Native reset restores the uncontrolled default or retains the controlled value without emitting `onValueChange`. Canceling reset preserves the draft. Reassociating the input with another form moves its reset listener too.

## Review and verification

Open Storybook's **Prototypes → Date text input** stories for standalone controls, date/range calendars, Base UI forms, WordPress error-wrapper composition, RTL calendars, and disabled/read-only states.

The tests cover Gregorian leap-year boundaries and years 0001–9999; strict date/time parsing; bounds, availability, and range order; controlled acceptance/rejection and cancellation; partial drafts and ranges; reset and form reassociation; Field labels, descriptions, focus, dirty, touched, and validation timing; custom/server errors; native and Base UI submission; keyboard calendar selection and dismissal; read-only and disabled inputs; and canonical text with several calendar locales. Clipboard parsing is covered in jsdom; actual paste was also checked in the browser preview.

Browser tests run in Chromium through the repository's standard test command. Locale cases assert calendar direction and stable ISO text, not exhaustive localized calendar formatting. This is not a React Aria segmented-editor parity claim. Screen-reader speech, mobile keyboards, and editor/admin integration still require verification. The prototype is not part of the package entrypoint and must not be treated as a released API.
