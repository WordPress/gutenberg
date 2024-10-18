# Block Inspector Tabs

Block Inspector Tabs tabs aim to help organize and delineate the design tools within the Block Inspector sidebar. Inspector's design tools are categorized under three tabs:

- **Settings**: Contains configuration settings for the block that are not appearance-related, e.g., Number of columns or whether the block links to another resource.
- **Appearance**: Groups panels and controls related specifically to styling the appearance of the current block, e.g., typography and colors.
- **List View**: Contains controls for managing a block's children in a similar manner to the editor's list view, e.g., editing submenus and links in the Navigation block.

## Display

Block Inspector will only render tabs when it makes sense to do so. As such, there are a few conditions around their display:

- A tab is only rendered if it contains items for display.
- If the Settings tab would only contain the Advanced panel, it will be consolidated into the Appearance tab.
- If the Block Inspector only has a single tab to display, tabs will not be rendered. Instead, the design tools will be rendered directly into the sidebar as they would have been prior to WordPress 6.2.

It is possible that the Block Inspector tabs may not make sense for all blocks. Plugins might also aim to overhaul a block's available tools. In these cases, it would be desirable to disable Block Inspector tabs. This can be achieved via the `blockInspectorTabs` setting. One approach to doing so might be via the `block_editor_settings_all` filter, like the example below:

```php
function my_plugin_disable_tabs_for_my_custom_block( $settings ) {
	$current_tab_settings = _wp_array_get( $settings, array( 'blockInspectorTabs' ), array() );
	$settings['blockInspectorTabs'] = array_merge(
		$current_tab_settings,
		array( 'my-plugin/my-custom-block' => false )
	);

	return $settings;
}

add_filter( 'block_editor_settings_all', 'my_plugin_disable_tabs_for_my_custom_block' );
```

If available, the Block Inspector tabs will be displayed in the following order: List View, Settings, and Appearance. The default selected tab will be the first available. For the majority of blocks, this will be the Settings tab.

## Inspector Control Groups

You can define which `InspectorControls` group to render controls into via the `group` prop.

For styles-related controls that do not fit conceptually under the block support panels (border, color, dimensions, typography, etc.) can be included under the "Appearance" tab in the Block Inspector.

```jsx
<InspectorControls group="styles">
  // Add your custom styles-related controls here.
</InspectorControls>
```

## Block Inspector Tabs vs InspectorControl Groups

Each Block Inspector tab is responsible for displaying a subset of the available Inspector Controls groups.

- **Settings Tab**: Includes any items rendered into the `default`, `settings` (alias for default), `advanced`, or `position` groups.
- **Appearance Tab**: Renders block support groups such as `border`, `color`, `dimensions`, and `typography`. It also now includes the new `styles` group, which offers a means of displaying items under the Appearance tab but outside of the block support.

## Screenshots

### Settings and Styles

| Default (with icons) | Text only labels |
| ------ | ----- |
|<img width="277" alt="Default (with icons)" src="https://github.com/WordPress/gutenberg/assets/905781/0b750691-82a5-454e-9a91-bb2b789cc566">|<img width="276" alt="Text only labels" src="https://github.com/WordPress/gutenberg/assets/905781/fe520677-9276-4631-b5bb-a4035dea79f3">|

### List View, Settings, and Styles

| Default (with icons) | Text only labels |
| ------ | ----- |
|<img width="277" alt="Default (with icons)" src="https://github.com/WordPress/gutenberg/assets/905781/ecb2dc8e-a742-4153-8552-3b9faf65821b">|<img width="275" alt="Text only labels" src="https://github.com/WordPress/gutenberg/assets/905781/f74caba9-700f-46b8-831f-cfd0645f31f0">|
