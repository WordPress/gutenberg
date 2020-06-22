# PluginMoreMenuItem

This slot will add a new item to the More Tools & Options section.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginMoreMenuItem } from '@wordpress/edit-post';
import { image } from '@wordpress/icons';

const MyButtonMoreMenuItemTest = () => (
	<PluginMoreMenuItem
		icon={ image }
		onClick={ () => {
			alert( 'Button Clicked' );
		} }
	>
		More Menu Item
	</PluginMoreMenuItem>
);

registerPlugin( 'more-menu-item-test', { render: MyButtonMoreMenuItemTest } );
```

## Location

![Location](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/plugin-more-menu-item.png?raw=true)
