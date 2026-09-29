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
| `min` | Minimum value | `0` |
| `max` | Maximum value | `100` |

`size` controls thickness. Small is 1.5px; medium and large use the theme's size tokens, which default to 4px and 8px. `tone` controls the filled indicator. Both tones use a neutral track. Brand uses the same WPDS brand fill as `Spinner`. Colors and corner radius follow `@wordpress/theme`.

The component supports `render`, `className`, `style`, and ref forwarding. The ref points to the root `div`, which has the `progressbar` role. Use `style` or `className` to constrain the width.

## Moving from `@wordpress/components`

The existing component remains supported. This component fills its container instead of defaulting to 160px. Its ref and element props apply to the visible root `div`, rather than a hidden native `progress` element. `value` is relative to `min` and `max`; pass `null` or omit `value` for indeterminate progress. The new component has no default export.
