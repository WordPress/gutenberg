# Navigation

Render a flat array of menu items into a waterfall style hierarchy navigation.

## Usage

```jsx
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationMenuItem as NavigationMenuItem,
} from '@wordpress/components';
import { useState } from '@wordpress/compose';

const data = [
    {
		title: 'Item 1',
		id: 'item-1',
	},
	{
		title: 'Item 2',
		id: 'item-2',
	},
	{
		title: 'Category',
		id: 'item-3',
		badge: '2',
	},
	{
		title: 'Child 1',
		id: 'child-1',
		parent: 'item-3',
		badge: '1',
	},
	{
		title: 'Child 2',
		id: 'child-2',
		parent: 'item-3',
	},
];

const MyNavigation = () => {
    const [ active, setActive ] = useState( 'item-1' );

	return (
		<Navigation activeItemId={ active } data={ data } rootTitle="Home">
			{ ( { level, parentLevel, NavigationBackButton } ) => {
				return (
					<>
						{ parentLevel && (
							<NavigationBackButton>
								<Icon icon={ arrowLeft } />
								{ parentLevel.title }
							</NavigationBackButton>
						) }
						<h1>{ level.title }</h1>
						<NavigationMenu>
							{ level.children.map( ( item ) => {
								return (
									<NavigationMenuItem
										{ ...item }
										key={ item.id }
										onClick={ ( selected ) =>
											setActive( selected.id )
										}
									/>
								);
							} ) }
						</NavigationMenu>
					</>
				);
			} }
		</Navigation>
};
```

## Navigation Props

Navigation supports the following props.

### `data`

-   Type: `array`
-   Required: Yes

An array of config objects for each menu item.

Config objects can be represented

#### `config.title`

-   Type: `string`
-   Required: Yes

A menu item's title.

#### `config.id`

-   Type: `string|Number`
-   Required: Yes

A menu item's id.

#### `config.parent`

-   Type: `string|Number`
-   Required: No

Specify a menu item's parent id. Defaults to the menu item's parent if none is provided.

#### `config.href`

-   Type: `string`
-   Required: No

Turn a menu item into a link by supplying a url.

#### `config.linkProps`

-   Type: `object`
-   Required: No

Supply an properties passed to the menu-item.

#### `config.LinkComponent`

-   Type: `Node`
-   Required: No

Supply a React component to render as the menu item. This is useful for router link components for internal navigation.

### `activeItemId`

-   Type: `string`
-   Required: Yes

The active screen id.

### `rootTitle`

-   Type: `string`
-   Required: No

A top level title.

## NavigationMenuItem Props

NavigationMenuItem supports the following props.

### `onClick`

-   Type: `function`
-   Required: No

A callback to handle selection of a menu item.
