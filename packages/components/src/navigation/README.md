# Navigation

<div class="callout callout-alert">
This component is deprecated. Consider using `Navigator` instead.
</div>

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

Render a navigation list with optional groupings and hierarchy.

## Usage

```jsx
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

const MyNavigation = () => (
	<Navigation>
		<NavigationMenu title="Home">
			<NavigationGroup title="Group 1">
				<NavigationItem item="item-1" title="Item 1" />
				<NavigationItem item="item-2" title="Item 2" />
			</NavigationGroup>
			<NavigationGroup title="Group 2">
				<NavigationItem
					item="item-3"
					navigateToMenu="category"
					title="Category"
				/>
			</NavigationGroup>
		</NavigationMenu>

		<NavigationMenu
			backButtonLabel="Home"
			menu="category"
			parentMenu="root"
			title="Category"
		>
			<NavigationItem badge="1" item="child-1" title="Child 1" />
			<NavigationItem item="child-2" title="Child 2" />
		</NavigationMenu>
	</Navigation>
);
```

## Navigation Props

`Navigation` supports the following props.

### `activeItem`

-   Type: `string`
-   Required: No

The active item slug.

### `activeMenu`

-   Type: `string`
-   Required: No
-   Default: "root"

The active menu slug.

### className

-   Type: `string`
-   Required: No

Optional className for the `Navigation` component.

### `onActivateMenu`

-   Type: `function`
-   Required: No

Sync the active menu between the external state and the Navigation's internal state.

## Navigation Menu Props

`NavigationMenu` supports the following props.

### `backButtonLabel`

-   Type: `string`
-   Required: No
-   Default: parent menu's title or "Back"

The back button label used in nested menus. If not provided, the label will be inferred from the parent menu's title.
If for some reason the parent menu's title is not available then it will default to "Back".

### `onBackButtonClick`

-   Type: `function`
-   Required: No

A callback to handle clicking on the back button. If this prop is provided then the back button will be shown.

### className

-   Type: `string`
-   Required: No

Optional className for the `NavigationMenu` component.

### hasSearch

-   Type: `boolean`
-   Required: No

Enable the search feature on the menu title.

### `menu`

-   Type: `string`
-   Required: No
-   Default: "root"

The unique identifier of the menu. The root menu can omit this, and it will default to "root"; all other menus need to specify it.

### onSearch

-   Type: `( searchString: string ) => void;`
-   Required: No

When `hasSearch` is active, this function handles the search input's `onChange` event, making it controlled from the outside. It requires setting the `search` prop as well.

### isSearchDebouncing

-   Type: `boolean`
-   Required: No

Indicates whether the search is debouncing or not. In case of `true` the "No results found." text is omitted. Used to prevent showing "No results found." text between debounced searches.

### `parentMenu`

-   Type: `string`
-   Required: No

The parent menu slug; used by nested menus to indicate their parent menu.

### search

-   Type: `string`
-   Required: No

When `hasSearch` is active and `onSearch` is provided, this controls the value of the search input. Required when the `onSearch` prop is provided.

### `isEmpty`

-   Type: `boolean`
-   Required: No

Indicates whether the menu is empty or not. Used together with the `hideIfTargetMenuEmpty` prop of Navigation Item.

### `title`

-   Type: `string`
-   Required: No

The menu title. It's also the field used by the menu search function.

### `titleAction`

-   Type: `React.ReactNode`
-   Required: No

Use this prop to render additional actions in the menu title.

## Navigation Group Props

`NavigationGroup` supports the following props.

### className

-   Type: `string`
-   Required: No

Optional className for the `NavigationGroup` component.

### `title`

-   Type: `string`
-   Required: No

The group title.

## Navigation Item Props

`NavigationItem` supports the following props.

### `badge`

-   Type: `string|Number`
-   Required: No

The item badge content.

### className

-   Type: `string`
-   Required: No

Optional className for the `NavigationItem` component.

### `href`

-   Type: `string`
-   Required: No

If provided, renders `a` instead of `button`.

### `icon`

-   Type: `JSX.Element`
-   Required: No

If no `children` are passed, this prop allows to specify a custom icon for the menu item.

### `item`

-   Type: `string`
-   Required: No

The unique identifier of the item.

### `navigateToMenu`

-   Type: `string`
-   Required: No

The child menu slug. If provided, clicking on the item will navigate to the target menu.

### `hideIfTargetMenuEmpty`

-   Type: `boolean`
-   Required: No

Indicates whether this item should be hidden if the menu specified in `navigateToMenu` is marked as empty in the `isEmpty` prop. Used together with the `isEmpty` prop of Navigation Menu.

### `onClick`

-   Type: `React.MouseEventHandler`
-   Required: No

A callback to handle clicking on a menu item.

### `isText`

-   Type: `boolean`
-   Required: No
-   Default: false

If set to true then the menu item will only act as a text-only item rather than a button.

### `title`

-   Type: `string`
-   Required: No

The item title.
