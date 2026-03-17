# TabbedSidebar

The `TabbedSidebar` component is used to create secondary panels in the editor with tabbed navigation.

## Development guidelines

This acts as a wrapper for the `Tabs` component, adding conventions that can be shared between all secondary panels, including:

-   A close button
-   Tabs that fill the panel
-   Custom scrollbars

### Usage

```jsx
import { TabbedSidebar } from '@wordpress/block-editor';

const MyTabbedSidebar = () => (
	<TabbedSidebar
		tabs={ [
			{
				name: 'slug-1',
				title: _x( 'Title 1', 'context' ),
				panel: <PanelContents />,
				panelRef: useRef('an-optional-ref'),
			},
			{
				name: 'slug-2',
				title: _x( 'Title 2', 'context' ),
				panel: <PanelContents />,
			},
		] }
		onClose={ onClickCloseButton }
		onSelect={ onSelectTab }
		defaultTabId="slug-1"
		selectedTab="slug-1"
		closeButtonLabel="Close sidebar"
		ref={ tabsRef }
	/>
);
```

### Props

### `defaultTabId`

-   **Type:** `String`
-   **Default:** `undefined`

The ID of the tab to be selected by default when the component renders.

### `onClose`

-   **Type:** `Function`

Function called when the close button is clicked.

### `onSelect`

-   **Type:** `Function`

Function called when a tab is selected. Receives the selected tab's ID as an argument.

### `selectedTab`

-   **Type:** `String`
-   **Default:** `undefined`

The ID of the currently selected tab.

### `tabs`

-   **Type:** `Array`
-   **Default:** `undefined`

Array of tab objects. Each tab should have:

- `name` (string): Unique identifier for the tab
- `title` (string): Display title for the tab
- `panel` (React.Node): Content to display in the tab panel
- `panelRef` (React.Ref, optional): Reference to the tab panel element

#### `closeButtonLabel`

-   **Type:** `String`

Accessibility label for the close button.