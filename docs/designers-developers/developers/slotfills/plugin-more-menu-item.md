# PluginMoreMenuItem

This slot will add a new item to the More Tools & Options section.

## Example

```js
const { registerPlugin } = wp.plugins;
const { PluginMoreMenuItem } = wp.editPost;

const MyButtonMoreMenuItemTest = () => (
	<PluginMoreMenuItem
		icon="smiley"
		onClick={ () => { alert( 'Button Clicked' ) } }
	>
		More Menu Item
	</PluginMoreMenuItem>
);

registerPlugin( 'more-menu-item-test', { render: MyButtonMoreMenuItemTest } );
```

## Location

![Location](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/plugin-more-menu-item.png?raw=true)

