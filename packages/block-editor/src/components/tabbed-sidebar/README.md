# Tabbed Panel

The `TabbedPanel` component is used to create the secondary panels in the editor.

## Development guidelines

This acts as a wrapper for the `Tabs` component, but adding conventions that can be shared between all secondary panels, for example:

-   A close button
-   Tabs that fill the panel
-   Custom scollbars

### Usage

Renders a block alignment toolbar with alignments options.

```jsx
import { TabbedSidebar } from '@wordpress/components';

const MyTabbedSidebar = () => (
	<TabbedSidebar
		tabs={ [
			{
				name: 'slug-1',
				title: _x( 'Title 1', 'context' ),
				panel: <PanelContents>,
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
		ref={ tabsRef }
	/>
);
```

### Props

### `defaultTabId`

-   **Type:** `String`
-   **Default:** `undefined`

This is passed to the `Tabs` component so it can handle the tab to select by default when it component renders.

### `onClose`

-   **Type:** `Function`

The function that is called when the close button is clicked.

### `onSelect`

-   **Type:** `Function`

This is passed to the `Tabs` component - it will be called when a tab has been selected. It is passed the selected tab's ID as an argument.

### `selectedTab`

-   **Type:** `String`
-   **Default:** `undefined`

This is passed to the `Tabs` component - it will display this tab as selected.

### `tabs`

-   **Type:** `Array`
-   **Default:** `undefined`

An array of tabs which will be rendered as `TabList` and `TabPanel` components.
