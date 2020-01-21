NavigableTreeGrid
==============

`<NavigableTreeGrid />` is a container component used to add keyboard navigation to a child tree grid or tree view. 

A tree grid allows the user to navigate using arrow keys. Up/down to navigate vertically across rows, and left/right to navigate between focusables in a row.

A tree Grid should also implement a roving tab index. See also the RovingTabIndex `<RovingTabIndexContainer/>`, `<RovingTabIndexItem>` components for components that assist with this behaviour.

For more information on marking up a tree grid, see the following links:

- https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html
- https://www.w3.org/TR/wai-aria-practices/examples/treeview/treeview-2/treeview-2a.html

## Usage

Wrap the tree with `<NavigableTreeGrid />`:

```jsx
function TreeMenu() {
	return (
		<NavigableTreeGrid>
			<ul role="tree">
				<li role="treeitem">
					<button>Select</button>
					<button>Move Up</button>
					<button>Move Down</button>
					<ul role="group">
						<li role="treeitem">
							<button>Select</button>
							<button>Move Up</button>
							<button>Move Down</button>
						</li>
					</ul>
				</li>
				<li role="treeitem">
					<button>Select</button>
					<button>Move Up</button>
					<button>Move Down</button>
				</li>
			</ul>
		</NavigableTreeGrid>
	);
}
```
