# Elevation

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Elevation` is a core component that renders shadow, using the component system's shadow system.

## Usage

The shadow effect is generated using the `value` prop.

```jsx
import {
	__experimentalElevation as Elevation,
	__experimentalSurface as Surface,
	__experimentalText as Text,
} from '@wordpress/components';

function Example() {
	return (
		<Surface>
			<Text>Code is Poetry</Text>
			<Elevation value={ 5 } />
		</Surface>
	);
}
```

## Props

### `active`: `number`

Size of the shadow value when active (see the `value` and `isInteractive` props).

-   Required: No

### `borderRadius`: `CSSProperties[ 'borderRadius' ]`

Renders the border-radius of the shadow.

-   Required: No
-   Default: `inherit`

### `focus`: `number`

Size of the shadow value when focused (see the `value` and `isInteractive`props).

-   Required: No

### `hover`: `number`

Size of the shadow value when hovered (see the `value` and `isInteractive` props).

-   Required: No

### `isInteractive`: `boolean`

Determines if `hover`, `active`, and `focus` shadow values should be automatically calculated and rendered.

-   Required: No
-   Default: `false`

### `offset`: `number`

Dimensional offsets (margin) for the shadow.

-   Required: No
-   Default: `0`

### `value`: `number`

Size of the shadow, based on the Style system's elevation system. The `value` determines the strength of the shadow, which sense of depth.

In the example below, `isInteractive` is activated to give a better sense of depth.

```jsx
import { __experimentalElevation as Elevation } from '@wordpress/components';

function Example() {
	return (
		<div>
			<Elevation isInteractive value={ 200 } />
		</div>
	);
}
```

-   Required: No
-   Default: `0`
