# PluginBlockSettingsMenuItem

This slot allows for adding a new item into the More Options area.
This will either appear in the controls for each block or at the Top Toolbar depending on the users setting.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginBlockSettingsMenuItem } from '@wordpress/editor';

const PluginBlockSettingsMenuGroupTest = () => (
	<PluginBlockSettingsMenuItem
		allowedBlocks={ [ 'core/paragraph' ] }
		icon="smiley"
		label="Menu item text"
		onClick={ () => {
			alert( 'clicked' );
		} }
	/>
);

registerPlugin( 'block-settings-menu-group-test', {
	render: PluginBlockSettingsMenuGroupTest,
} );
```

## Location

![Location](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/plugin-block-settings-menu-item-screenshot.png?raw=true 'PluginBlockSettingsMenuItem Location')
