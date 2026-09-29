# ProgressBar

Displays the progress of a task. The bar fills the available width. Provide `aria-label` or `aria-labelledby` to name the task; the default accessible name is "Loading".

```tsx
import { ProgressBar } from '@wordpress/ui';

<ProgressBar
	aria-label="Uploading files"
	value={ 60 }
	size="medium"
	tone="brand"
/>;
```

Omit `value` or pass `null` for indeterminate progress. Use `min` and `max` for a range other than the default 0 to 100. Values outside the range are clamped. `getAriaValueText` can describe the value in task-specific units.

| Prop | Values | Default |
| --- | --- | --- |
| `value` | A number between `min` and `max`, or `null` | `null` |
| `size` | `small`, `medium`, `large` | `small` |
| `tone` | `neutral`, `brand` | `neutral` |
| `color` | Any CSS color value for the track | `var(--wpds-color-background-track-neutral)` |
| `min` | Minimum value | `0` |
| `max` | Maximum value | `100` |

`size` controls thickness. Small is 1.5px; medium and large use the theme's size tokens, which default to 4px and 8px. `tone` controls the filled indicator. Both tones use a neutral track by default. Brand uses the WPDS brand thumb token. Default colors and corner radius follow `@wordpress/theme`.

Use `color` to customize the track background independently of `tone`. It accepts any CSS color value, including CSS variables and `currentColor` to inherit the surrounding text color. When supplied, `color` takes precedence over `style.color` and preserves the other inline styles.

```tsx
<ProgressBar value={ 60 } tone="brand" color="#e9d5ff" />
```

The component supports `render`, `className`, `style`, and ref forwarding. The ref points to the root `div`, which has the `progressbar` role. Use `style` or `className` to constrain the width.

## Moving from `@wordpress/components`

The existing component remains supported. This component fills its container instead of defaulting to 160px. Its ref and element props apply to the visible root `div`, rather than a hidden native `progress` element. `value` is relative to `min` and `max`; pass `null` or omit `value` for indeterminate progress. The new component has no default export.
