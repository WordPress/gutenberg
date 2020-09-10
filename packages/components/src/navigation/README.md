# Navigation

Render a navigation list with optional groupings and hierarchy.

## Usage

```jsx
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationLevel as NavigationLevel,
} from '@wordpress/components';

const MyNavigation = () => (
	<Navigation>
		<NavigationLevel title="Home">
			<NavigationGroup title="Group 1">
				<NavigationItem item="item-1" title="Item 1" />
				<NavigationItem item="item-2" title="Item 2" />
			</NavigationGroup>
			<NavigationGroup title="Group 2">
				<NavigationItem
					item="item-3"
					navigateToLevel="category"
					title="Category"
				/>
			</NavigationGroup>
		</NavigationLevel>

		<NavigationLevel
			level="category"
			parentLevel="root"
			parentLevelTitle="Home"
			title="Category"
		>
			<ul>
				<NavigationItem
					badge="1"
					item="child-1"
					title="Child 1"
				/>
				<NavigationItem item="child-2" title="Child 2" />
			</ul>
		</NavigationLevel>
	</Navigation>
);
```

## Navigation Props

`Navigation` supports the following props.

### `activeItem`

-   Type: `string`
-   Required: No

The active item slug.

### `activeLevel`

-   Type: `string`
-   Required: No
-   Default: "root"

The active level slug.

### className

-   Type: `string`
-   Required: No

Optional className for the `Navigation` component.

### `setActiveItem`

-   Type: `function`
-   Required: No

Sync the active item between the external state and the Navigation's internal state.

### `setActiveLevel`

-   Type: `function`
-   Required: No

Sync the active level between the external state and the Navigation's internal state.

## Navigation Level

`NavigationLevel` supports the following props.

### className

-   Type: `string`
-   Required: No

Optional className for the `NavigationLevel` component.

### `level`

-   Type: `string`
-   Required: No
-   Default: "root"

The level slug.

### `parentLevel`

-   Type: `string`
-   Required: No

The parent level slug; used by nested levels to indicate their parent level.

### `parentLevelTitle`

-   Type: `string`
-   Required: No

The parent level title; used as back button label by nested levels.

### `title`

-   Type: `string`
-   Required: No

The level title.

## Navigation Group

`NavigationGroup` supports the following props.

### className

-   Type: `string`
-   Required: No

Optional className for the `NavigationGroup` component.

### `title`

-   Type: `string`
-   Required: No

The group title.

## Navigation Item

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

### `navigateToLevel`

-   Type: `string`
-   Required: No

The child level slug. If provided, clicking on the item will navigate to the target level.

### `onClick`

-   Type: `function`
-   Required: No

A callback to handle clicking on a menu item.

### `title`

-   Type: `string`
-   Required: No

The item title.
