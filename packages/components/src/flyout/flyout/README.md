# Flyout

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Flyout` is a component to render a floating content modal. It is similar in purpose to a tooltip, but renders content of any sort, not only simple text.

## Usage

```jsx
import { Button, __experimentalFlyout as Flyout, __experimentalText as Text } from '@wordpress/components';

function Example() {
	return (
		<Flyout trigger={ <Button>Show/Hide content</Button> }>
			<Text>Code is Poetry</Text>
		</Flyout>
	);
}
```

## Props

### `state`: `PopoverStateReturn`

- Required: No

### `label`: `string`

- Required: No

### `animated`: `boolean`

Determines if `Flyout` has animations.

- Required: No
- Default: `true`

### `animationDuration`: `boolean`

The duration of `Flyout` animations.

- Required: No
- Default: `160`

### `baseId`: `string`

ID that will serve as a base for all the items IDs. See https://reakit.io/docs/popover/#usepopoverstate

- Required: No
- Default: `160`

### `elevation`: `number`

Size of the elevation shadow. For more information, check out [`Card`](/packages/components/src/card/card/README.md#props).

- Required: No
- Default: `5`

### `maxWidth`: `CSSProperties[ 'maxWidth' ]`

Max-width for the `Flyout` element.

- Required: No
- Default: `360`

### `onVisibleChange`: `( ...args: any ) => void`

Callback for when the `visible` state changes.

- Required: No

### `trigger`: `FunctionComponentElement< any >`

Element that triggers the `visible` state of `Flyout` when clicked.

```jsx
<Flyout trigger={<Button>Greet</Button>}>
	<Text>Hi! I'm Olaf!</Text>
</Flyout>
```

- Required: Yes

### `visible`: `boolean`

Whether `Flyout` is visible. See [the `Reakit` docs](https://reakit.io/docs/popover/#usepopoverstate) for more information.

- Required: No
- Default: `false`

### `placement`: `PopperPlacement`

Position of the popover element. See [the `popper` docs](https://popper.js.org/docs/v1/#popperplacements--codeenumcode) for more information.

- Required: No
- Default: `auto`
