# Meter

Displays a measured quantity within a known range, such as storage usage, battery charge, or fuel level. Use `Progress` for task completion.

```tsx
import { Meter, Stack } from '@wordpress/ui';

<Meter.Root value={ 24 }>
	<Stack justify="space-between" gap="sm">
		<Meter.Label>Storage used</Meter.Label>
		<Meter.Value />
	</Stack>
	<Meter.Track>
		<Meter.Indicator tone="brand" />
	</Meter.Track>
</Meter.Root>;
```

## Parts

| Part | Purpose | Props |
| --- | --- | --- |
| `Meter.Root` | Shares the measured value and exposes the `meter` role. Defaults to a vertical `Stack` with a small gap. | Required `value: number`; `min`, `max`, `format`, `locale`, `getAriaValueText` |
| `Meter.Track` | The neutral background that contains and clips the indicator. | `children` |
| `Meter.Indicator` | The filled portion of the track. | `tone: 'neutral' \| 'brand'`, default `'neutral'` |
| `Meter.Label` | Visible text automatically associated with the root through `aria-labelledby`. | `children` |
| `Meter.Value` | Displays the root's formatted value. | Optional `children` function receiving `(formattedValue, value)` |

All parts support `render`, `className`, `style`, and ref forwarding. Root, Track, and Indicator render `div` elements by default. Label and Value render `span` elements using `Text` typography. Value is hidden from assistive technology because the root already exposes the current value. Meter is informational and does not add a Tab stop.

Place Label and Value inside Root, outside Track. Wrap them in `Stack` to arrange them together, or compose another layout through Root's `render` prop. If you omit Label, provide `aria-label` or `aria-labelledby` on Root.

## Values and formatting

Meter requires a numeric value. It has no indeterminate state. Values are relative to `min` and `max`, which default to 0 and 100. Use a minimum less than the maximum. Values outside the range are clamped. By default, Value shows the percentage within that range. `format` and `locale` control number formatting for both the visible Value and the root's default accessible value text. `getAriaValueText` overrides the accessible value text only.

```tsx
<Meter.Root
	value={ 3 }
	max={ 10 }
	format={ { style: 'decimal' } }
	getAriaValueText={ ( formattedValue ) => `${ formattedValue } of 10 GB used` }
>
	<Meter.Label>Storage used</Meter.Label>
	<Meter.Track>
		<Meter.Indicator />
	</Meter.Track>
	<Meter.Value>
		{ ( formattedValue ) => `${ formattedValue } of 10 GB used` }
	</Meter.Value>
</Meter.Root>
```

The Value child function receives the raw numeric value as its second argument. Root's accessible numeric value and the default formatted value are clamped to the range.

## Styling

Track fills the available width. Its height uses `--wpds-dimension-size-4xs`, which defaults to 8px. This distinguishes Meter from Progress's 1.5px track without a size prop. Both components share the same token styles for colors and corner radius.

Indicator's `tone` controls its color. Neutral and brand use the corresponding WPDS background thumb tokens. Track, Label, and Value keep their own colors.

Meter does not assign colors based on thresholds. Native meter attributes such as `low`, `high`, and `optimum` are not supported.
