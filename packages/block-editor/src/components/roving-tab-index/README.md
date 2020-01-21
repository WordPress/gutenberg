RovingTabIndex
==============

`RovingTabIndex` exports two separate components `<RovingTabIndex.Container />` and `<RovingTabIndex.Item />` that help to implement a roving tab index.

A roving tab index is helpful for a UI component that contains multiple focusable elements, it reduces the number of tab stops in such an element to a single tab stop. Some more information is available here:

- [WAI Aria Authoring Practices - Roving Tab Index](https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_roving_tabindex)

Some patterns that implement a roving tab index are:

- [Layout Grid](https://www.w3.org/TR/wai-aria-practices/examples/grid/LayoutGrids.html)
- [Editor Menu Bar](https://www.w3.org/TR/wai-aria-practices/examples/menubar/menubar-2/menubar-2.html)
- [Navigation Menu Bar](https://www.w3.org/TR/wai-aria-practices/examples/menubar/menubar-1/menubar-1.html)
- [Radio Group](https://www.w3.org/TR/wai-aria-practices/examples/radio/radio-1/radio-1.html)
- [Toolbar](https://www.w3.org/TR/wai-aria-practices/examples/toolbar/toolbar.html)
- [Tree Grid](https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html)
- [Tree View](https://www.w3.org/TR/wai-aria-practices/examples/treeview/treeview-2/treeview-2a.html)

## Usage

Wrap the component with `<RovingTabIndex.Container />` and individual focusables within the component with `<RovingTabIndex.Item />`:

```jsx
function TreeMenu() {
	return (
		<RovingTabIndex.Container>
			<ul role="tree">
				<li role="treeitem">
					<span>First item</span>
					<RovingTabIndex.Item>
						<button>Select</button>
					</RovingTabIndex.Item>
				</li>
				<li role="treeitem">
					<span>Second item</span>
					<RovingTabIndex.Item>
						<button>Select</button>
					</RovingTabIndex.Item>
				</li>
			</ul>
		</RovingTabIndex.Container>
	);
}
```

`</RovingTabIndex.Item>` is a component that can only take a single child element or component. That child must forward both the `ref` and `tabIndex` props to its underlying focusable element.
