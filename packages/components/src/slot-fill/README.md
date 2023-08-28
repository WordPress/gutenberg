# Slot Fill

Slot and Fill are a pair of components which enable developers to render elsewhere in a React element tree, a pattern often referred to as "portal" rendering. It is a pattern for component extensibility, where a single Slot may be occupied by an indeterminate number of Fills elsewhere in the application.

Slot Fill is heavily inspired by the [`react-slot-fill` library](https://github.com/camwest/react-slot-fill), but uses React's own portal rendering API.

## Usage

At the root of your application, you must render a `SlotFillProvider` which coordinates Slot and Fill rendering.

Then, render a Slot component anywhere in your application, giving it a name.

Any Fill will automatically occupy this Slot space, even if rendered elsewhere in the application.

You can either use the Fill component directly, or a wrapper component type as in the below example to abstract the slot name from consumer awareness.

```jsx
import {
	SlotFillProvider,
	Slot,
	Fill,
	Panel,
	PanelBody,
} from '@wordpress/components';

const MySlotFillProvider = () => {
	const MyPanelSlot = () => (
		<Panel header="Panel with slot">
			<PanelBody>
				<Slot name="MyPanelSlot" />
			</PanelBody>
		</Panel>
	);

	MyPanelSlot.Content = () => <Fill name="MyPanelSlot">Panel body</Fill>;

	return (
		<SlotFillProvider>
			<MyPanelSlot />
			<MyPanelSlot.Content />
		</SlotFillProvider>
	);
};
```

There is also `createSlotFill` helper method which was created to simplify the process of matching the corresponding `Slot` and `Fill` components:

```jsx
const { Fill, Slot } = createSlotFill( 'Toolbar' );

const ToolbarItem = () => <Fill>My item</Fill>;

const Toolbar = () => (
	<div className="toolbar">
		<Slot />
	</div>
);
```

## Props

The `SlotFillProvider` component does not accept any props.

Both `Slot` and `Fill` accept a `name` string prop, where a `Slot` with a given `name` will render the `children` of any associated `Fill`s.

`Slot` accepts a `bubblesVirtually` prop which changes the event bubbling behaviour:

-   By default, events will bubble to their parents on the DOM hierarchy (native event bubbling)
-   If `bubblesVirtually` is set to true, events will bubble to their virtual parent in the React elements hierarchy instead.

`Slot` with `bubblesVirtually` set to true also accept an optional `className` to add to the slot container.

`Slot` **without** `bubblesVirtually` accepts an optional `children` function prop, which takes `fills` as a param. It allows you to perform additional processing and wrap `fills` conditionally.

_Example_:

```jsx
const Toolbar = ( { isMobile } ) => (
	<div className="toolbar">
		<Slot name="Toolbar">
			{ ( fills ) => {
				return isMobile && fills.length > 3 ? (
					<div className="toolbar__mobile-long">{ fills }</div>
				) : (
					fills
				);
			} }
		</Slot>
	</div>
);
```

Props can also be passed from a `Slot` to a `Fill` by using the prop `fillProps` on the `Slot`:

```jsx
const { Fill, Slot } = createSlotFill( 'Toolbar' );

const ToolbarItem = () => (
	<Fill>
		{ ( { hideToolbar } ) => {
			<Button onClick={ hideToolbar }>Hide</Button>;
		} }
	</Fill>
);

const Toolbar = () => {
	const hideToolbar = () => {
		console.log( 'Hide toolbar' );
	};
	return (
		<div className="toolbar">
			<Slot fillProps={ { hideToolbar } } />
		</div>
	);
};
```
