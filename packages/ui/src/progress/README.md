# Progress

Displays task completion, such as an upload or installation. Use a meter for a measured quantity such as storage usage instead.

```tsx
import { Progress, Stack } from '@wordpress/ui';

<Progress.Root value={ 60 }>
	<Stack justify="space-between" gap="sm">
		<Progress.Label>Uploading files</Progress.Label>
		<Progress.Value />
	</Stack>
	<Progress.Track size="medium">
		<Progress.Indicator tone="brand" />
	</Progress.Track>
</Progress.Root>;
```

## Parts

| Part | Purpose | Props |
| --- | --- | --- |
| `Progress.Root` | Shares task state and exposes the `progressbar` role. Defaults to a vertical `Stack` with a small gap. | Required `value: number \| null`; `min`, `max`, `format`, `locale`, `getAriaValueText` |
| `Progress.Track` | The neutral background that contains and clips the indicator. | `size: 'small' \| 'medium' \| 'large'`, default `'small'` |
| `Progress.Indicator` | The filled portion of the track, or an animation for indeterminate progress. | `tone: 'neutral' \| 'brand'`, default `'neutral'`; optional `color` |
| `Progress.Label` | Visible text automatically associated with the root through `aria-labelledby`. | `children` |
| `Progress.Value` | Displays the root's formatted value, or nothing for indeterminate progress. | Optional `children` function receiving `(formattedValue, value)` |

All parts support `render`, `className`, `style`, and ref forwarding. Root, Track, and Indicator render `div` elements by default. Label and Value render `span` elements using `Text` typography. Value is hidden from assistive technology because the root already exposes the current value.

Place Label and Value inside Root, outside Track. Wrap them in `Stack` to arrange them together, or compose another layout through Root's `render` prop. If you omit Label, provide `aria-label` or `aria-labelledby` on Root. There is no default task name.

## Values and formatting

Pass `value={ null }` for indeterminate progress. A numeric value is relative to `min` and `max`, which default to 0 and 100. Values outside the range are clamped. `format` and `locale` control number formatting for both the visible Value and the root's default accessible value text. `getAriaValueText` overrides the accessible value text only.

```tsx
<Progress.Root
	value={ 3 }
	max={ 10 }
	format={ { style: 'decimal' } }
	getAriaValueText={ ( formattedValue ) => `${ formattedValue } of 10 files` }
>
	<Progress.Label>Uploading files</Progress.Label>
	<Progress.Track>
		<Progress.Indicator />
	</Progress.Track>
	<Progress.Value>
		{ ( formattedValue, value ) =>
			value === null ? 'Preparing files' : `${ formattedValue } of 10 files`
		}
	</Progress.Value>
</Progress.Root>
```

The Value child function follows Base UI's API. Check the numeric `value` for `null` when providing indeterminate text. Root uses the translated text "In progress" as its default indeterminate accessible value text.

## Styling

Track fills the available width. Its `size` controls thickness: small is 1.5px; medium and large use theme size tokens, which default to 4px and 8px. Default colors and corner radius follow `@wordpress/theme`.

Indicator's `tone` controls its color. Brand uses the WPDS brand thumb token. Its `color` prop accepts any CSS color, including CSS variables and `currentColor` to inherit the surrounding text color. An explicit color overrides `tone` and `style.color`, preserving other inline styles. Track, Label, and Value keep their own colors.

```tsx
<Progress.Indicator tone="brand" color="#8b2fc9" />
```

## Moving from `@wordpress/components`

The existing `ProgressBar` remains supported. `Progress` uses explicit composition instead of a single component. Put `value` and the task's accessible name on Root, nest Indicator inside Track, and optionally add Label and Value. Pass `null` explicitly for indeterminate progress.

Track fills its container instead of defaulting to 160px. Root's ref and element props apply to the visible `div` with the `progressbar` role, rather than a hidden native `progress` element. Each other part has its own ref and styling props. The package exports the `Progress` namespace; there is no default export.
