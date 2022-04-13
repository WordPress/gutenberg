# BoxModelOverlay

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`<BoxModelOverlay>` component shows a visual overlay of the [box model](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model) (currently only paddings and margins are available) on top of the target element. This is often accompanied by the `<BoxControl>` component to show a preview of the styling changes in the editor.

## Usage

Wrap `<YourComponent>` with `<BoxModelOverlay>` with the `showValues` prop.
Note that `<YourComponent>` should accept `ref` for `<BoxModelOverlay>` to automatically inject into.

```jsx
import { __experimentalBoxModelOverlay as BoxModelOverlay } from '@wordpress/components';

// Show all overlays and all sides.
const showValues = {
	margin: {
		top: true,
		right: true,
		bottom: true,
		left: true,
	},
	padding: {
		top: true,
		right: true,
		bottom: true,
		left: true,
	},
};

const Example = () => {
	return (
		<BoxModelOverlay showValues={ showValues }>
			<YourComponent />
		</BoxModelOverlay>
	);
};
```

You can also use the `targetRef` prop to manually pass the ref to `<BoxModelOverlay>` for more advanced usage. This is useful if you need to control where the overlay is rendered or need special handling for the target's `ref`.

```jsx
const Example = () => {
	const targetRef = useRef();

	return (
		<>
			<YourComponent ref={ targetRef } />

			<BoxModelOverlay
				showValues={ showValues }
				targetRef={ targetRef }
			/>
		</>
	);
};
```

`<BoxModelOverlay>` internally uses [`Popover`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/components/src/popover/README.md) to position the overlay. This means that you can use `<Popover.Slot>` to alternatively control where the overlay is rendered.

```jsx
const Example = () => {
	return (
		<>
			<BoxModelOverlay showValues={ showValues }>
				<YourComponent />
			</BoxModelOverlay>

			<Popover.Slot />
		</>
	);
};
```

`<BoxModelOverlay>` under the hood listens to size and style changes of the target element to update the overlay style automatically using `ResizeObserver` and `MutationObserver`. In some edge cases when the observers aren't picking up the changes, you can use the instance method `update` on the ref of the overlay to update it manually.

```jsx
const Example = () => {
	const overlayRef = useRef();

	// Update the overlay style manually when `deps` changes.
	useEffect( () => {
		overlayRef.current.update();
	}, [ deps ] );

	return (
		<BoxModelOverlay showValues={ showValues } ref={ overlayRef }>
			<YourComponent />
		</BoxModelOverlay>
	);
};
```

Here's an example of using it with `<BoxControl>`:

```jsx
const Example = () => {
	const [ values, setValues ] = useState( {
		top: '50px',
		right: '10%',
		bottom: '50px',
		left: '10%',
	} );
	const [ showValues, setShowValues ] = useState( {} );

	return (
		<>
			<BoxControl
				label="Padding"
				values={ values }
				onChange={ ( nextValues ) => setValues( nextValues ) }
				onChangeShowVisualizer={ setShowValues }
			/>

			<BoxModelOverlay showValues={ showValues }>
				<div
					style={ {
						height: 300,
						width: 300,
						paddingTop: values.top,
						paddingRight: values.right,
						paddingBottom: values.bottom,
						paddingLeft: values.left,
					} }
				/>
			</BoxModelOverlay>
		</>
	);
};
```

## Props

Additional props not listed below will be passed to the underlying `Popover` component.

### `showValues`

Controls which overlays and sides are visible. Currently the only properties supported are `margin` and `padding`, each with four sides (`top`, `right`, `bottom`, `left`).

- Type: `Object`
- Required: Yes
- Default: `{}`

### `children`

A single React element to rendered as the target. It should implicitly accept `ref` to be passed in.

- Type: `React.ReactElement`
- Required: Yes if `targetRef` is not passed

### `targetRef`

A ref object for the target element.

- Type: `Ref<HTMLElement>`
- Required: Yes if `children` is not passed
