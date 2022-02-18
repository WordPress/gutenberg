# TreeGrid

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>
## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

`TreeGrid`, `TreeGridRow`, and `TreeGridCell` are components used to create a tree hierarchy. They're not visually styled components, but instead help with adding keyboard navigation and roving tab index behaviors to tree grid structures.

A tree grid is a hierarchical 2 dimensional UI component, for example it could be used to implement a file system browser.

A tree grid allows the user to navigate using arrow keys. Up/down to navigate vertically across rows, and left/right to navigate horizontally between focusables in a row.

For more information on a tree grid, see the following links:

-   https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html

### Usage

The `TreeGrid` renders both a `table` and `tbody` element, and is intended to be used with `TreeGridRow` (`tr`) and `TreeGridCell` (`td`) to build out a grid.

```jsx
function TreeMenu() {
	return (
		<TreeGrid>
			<TreeGridRow level={ 1 } positionInSet={ 1 } setSize={ 2 }>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onSelect } { ...props }>
							Select
						</Button>
					) }
				</TreeGridCell>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onMoveUp } { ...props }>
							Move Up
						</Button>
					) }
				</TreeGridCell>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onMoveDown } { ...props }>
							Move Down
						</Button>
					) }
				</TreeGridCell>
			</TreeGridRow>
			<TreeGridRow level={ 1 } positionInSet={ 2 } setSize={ 2 }>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onSelect } { ...props }>
							Select
						</Button>
					) }
				</TreeGridCell>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onMoveUp } { ...props }>
							Move Up
						</Button>
					) }
				</TreeGridCell>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onMoveDown } { ...props }>
							Move Down
						</Button>
					) }
				</TreeGridCell>
			</TreeGridRow>
			<TreeGridRow level={ 2 } positionInSet={ 1 } setSize={ 1 }>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onSelect } { ...props }>
							Select
						</Button>
					) }
				</TreeGridCell>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onMoveUp } { ...props }>
							Move Up
						</Button>
					) }
				</TreeGridCell>
				<TreeGridCell>
					{ ( props ) => (
						<Button onClick={ onMoveDown } { ...props }>
							Move Down
						</Button>
					) }
				</TreeGridCell>
			</TreeGridRow>
		</TreeGrid>
	);
}
```

### Sub-Components

#### TreeGrid

##### Props

Aside from the documented callback functions, any props specified will be passed to the `table` element rendered by `TreeGrid`.

`TreeGrid` should always have children.

###### onFocusRow( event: Event, startRow: HTMLElement, destinationRow: HTMLElement )

Callback that fires when focus is shifted from one row to another via the UP and DOWN keys.
The callback is passed the event, the start row element that the focus was on originally, and
the destination row element after the focus has moved.

-   Type: `Function`
-   Required: No

###### onCollapseRow( row: HTMLElement )

A callback that passes in the row element to be collapsed.

-   Type: `Function`
-   Required: No

###### onExpandRow( row: HTMLElement )

A callback that passes in the row element to be expanded.

-   Type: `Function`
-   Required: No

#### TreeGridRow

##### Props

Additional props other than those specified below will be passed to the `tr` element rendered by `TreeGridRow`, so for example, it is possible to also set a `className` on a row.

###### level

An integer value designating the level in the hierarchical tree structure. Counting starts at 1. A value of `1` indicates the root level of the structure.

-   Type: `Number`
-   Required: Yes

###### positionInSet

An integer value that represents the position in the set. A set is the count of elements at a specific level. Counting starts at 1.

-   Type: `Number`
-   Required: Yes

###### setSize

An integer value that represents the total number of items in the set ... that is the total number of items at this specific level of the hierarchy.

-   Type: `Number`
-   Required: Yes

###### isExpanded

An optional value that designates whether a row is expanded or collapsed. Currently this value only sets the correct aria-expanded property on a row, it has no other built-in behavior.

-   Type: `Boolean`
-   Required: No

### TreeGridCell

#### Props

`TreeGridCell` accepts no specific props. Any props specified will be passed to the `td` element rendered by `TreeGridCell`.

#### `children` as a function

`TreeGridCell` renders children using a function:

```jsx
<TreeGridCell>
	{ ( props ) => (
		<Button onClick={ onMoveDown } { ...props }>
			Move Down
		</Button>
	) }
</TreeGridCell>
```

Props passed as an argument to the render prop must be passed to the child focusable component/element within the cell. If a component is used, it must correctly handle the `onFocus`, `tabIndex`, and `ref` props, passing these to the element it renders. These props are used to handle the roving tab index functionality of the tree grid.

## Related components

-   This component implements `RovingTabIndex`.
