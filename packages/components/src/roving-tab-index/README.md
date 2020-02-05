# RovingTabIndex

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

`RovingTabIndex` and `RovingTabIndexItem` are components that help to manage focus in the style of a roving tab index.

A roving tab index is helpful for a UI component that contains multiple focusable elements, it reduces the number of tab stops in such a component to a single tab stop. Some more information is available here:

- [WAI Aria Authoring Practices - Roving Tab Index](https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_roving_tabindex)

Some patterns that implement a roving tab index are:

- [Layout Grid](https://www.w3.org/TR/wai-aria-practices/examples/grid/LayoutGrids.html)
- [Editor Menu Bar](https://www.w3.org/TR/wai-aria-practices/examples/menubar/menubar-2/menubar-2.html)
- [Navigation Menu Bar](https://www.w3.org/TR/wai-aria-practices/examples/menubar/menubar-1/menubar-1.html)
- [Radio Group](https://www.w3.org/TR/wai-aria-practices/examples/radio/radio-1/radio-1.html)
- [Toolbar](https://www.w3.org/TR/wai-aria-practices/examples/toolbar/toolbar.html)
- [Tree Grid](https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html)
- [Tree View](https://www.w3.org/TR/wai-aria-practices/examples/treeview/treeview-2/treeview-2a.html)

This component doesn't implement any keyboard navigation, instead it handles setting the correct `tabIndex` value on focusable elements. It should be composed with another component that implements keyboard navigation (e.g. arrow key navigation).

### Usage

Wrap the component with `RovingTabIndex` and declare individual focusable elements within the component with `RovingTabIndexItem`.

```jsx
function TreeMenu() {
	return (
		<RovingTabIndex>
			<ul role="tree">
				<li role="treeitem">
					<span>First item</span>
					<RovingTabIndexItem as={ Button }>
						Select
					</RovingTabIndexItem>
				</li>
				<li role="treeitem">
					<span>Second item</span>
					<RovingTabIndexItem as={ Button }>
						Select
					</RovingTabIndexItem>
				</li>
			</ul>
		</RovingTabIndex>
	);
}
```

### Sub-Components

#### RovingTabIndex

##### Props

This component takes no props, but should always have `children`.

#### `RovingTabIndexItem`

##### Props

###### as

Specify the component that the item should render as. For example the following renders a button with the text 'Close':

```jsx
<RovingTabIndexItem as={ Button }>Close</RovingTabIndexItem>
```

All props other than `as` are forwarded to the component, for example, the following code passes the `onClick` handler to the rendered `Button` component:

```jsx
<RovingTabIndexItem as={ Button } onClick={ onClose }>Close</RovingTabIndexItem>
```

Components used with the `as` prop must be able to receive the `onFocus`, `tabIndex`, and `ref` props and pass those props to the element it renders.

As an alternative to `as`, `RovingTabIndexItem` also supports a render prop function:

```jsx
<RovingTabIndexItem>
	{ ( props ) => <Button onClick={ onClose } { ...props }>Close</Button> }
</RovingTabIndexItem>
```

The `props` passed to `Button` in this example contain the aforementioned `onFocus`, `tabIndex`, and `ref` props. For the roving tab index functionality to work, they should always be passed onto the `RovingTabIndexItem`'s child and handled correctly by that child.

- Type: `React Component`
- Required: No

## Related components
- `TreeGrid` implements a `RovingTabIndex`.
