# Filters and hooks

The Editor provides numerous filters and hooks that allow you to modify the editing experience. Here are a few.

## Editor settings

One of the most common ways to modify the Editor is through the [`block_editor_settings_all`](https://developer.wordpress.org/reference/hooks/block_editor_settings_all/) PHP filter, which is applied before settings are sent to the initialized Editor.

The `block_editor_settings_all` hook passes two parameters to the callback function:

-   `$settings` – An array of [configurable settings](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#editor-settings) for the Editor.
-   `$context` – An instance of [`WP_Block_Editor_Context`](https://developer.wordpress.org/reference/classes/wp_block_editor_context/), an object that contains information about the current Editor.

The following example disables the Code Editor for users who cannot activate plugins (Administrators). Add this to a plugin or your theme's `functions.php` file to test it.

```php
add_filter( 'block_editor_settings_all', 'example_restrict_code_editor' );

function example_restrict_code_editor( $settings ) {
	$can_active_plugins = current_user_can( 'activate_plugins' );

	// Disable the Code Editor for users that cannot activate plugins (Administrators).
	if ( ! $can_active_plugins ) {
		$settings[ 'codeEditingEnabled' ] = false;
	}

	return $settings;
}
```

For more examples, check out the [Editor Hooks](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/) documentation that includes the following use cases:

-   [Set a default image size](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#set-a-default-image-size)
-   [Disable Openverse](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#disable-openverse)
-   [Disable the Font Library](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#disable-the-font-library)
-   [Restrict responsive editing](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#restrict-responsive-editing)
-   [Restrict block states editing](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#restrict-block-states-editing)
-   [Disable block inspector tabs](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#disable-block-inspector-tabs)

## Server-side theme.json filters

The theme.json file is a great way to control interface options, but it only allows for global or block-level modifications, which can be limiting in some scenarios.

For instance, in the previous section, color and typography controls were disabled globally using theme.json. But let's say you want to enable color settings for users who are Administrators.

To provide more flexibility, WordPress 6.1 introduced server-side filters allowing you to customize theme.json data at four different data layers.

-   [`wp_theme_json_data_default`](https://developer.wordpress.org/reference/hooks/wp_theme_json_data_default/) - Hooks into the default data provided by WordPress
-   [`wp_theme_json_data_blocks`](https://developer.wordpress.org/reference/hooks/wp_theme_json_data_blocks/) - Hooks into the data provided by blocks.
-   [`wp_theme_json_data_theme`](https://developer.wordpress.org/reference/hooks/wp_theme_json_data_theme/) - Hooks into the data provided by the current theme.
-   [`wp_theme_json_data_user`](https://developer.wordpress.org/reference/hooks/wp_theme_json_data_user/) - Hooks into the data provided by the user.

In the following example, the data from the current theme's theme.json file is updated using the `wp_theme_json_data_theme` filter. Color controls are restored if the current user is an Administrator.

```php
// Disable color controls for all users except Administrators.
function example_filter_theme_json_data_theme( $theme_json ){
    $is_administrator = current_user_can( 'edit_theme_options' );

    if ( $is_administrator ) {
        $new_data = array(
            'version'  => 2,
            'settings' => array(
                'color' => array(
                    'background'       => true,
                    'custom'           => true,
                    'customDuotone'    => true,
                    'customGradient'   => true,
                    'defaultGradients' => true,
                    'defaultPalette'   => true,
                    'text'             => true,
                ),
            ),
        );
    }

	return $theme_json->update_with( $new_data );
}
add_filter( 'wp_theme_json_data_theme', 'example_filter_theme_json_data_theme' );
```

The filter receives an instance of the `WP_Theme_JSON_Data class` with the data for the respective layer. Then, you pass new data in a valid theme.json-like structure to the `update_with( $new_data )` method. A theme.json version number is required in `$new_data`.

## Server-side view configuration filter

DataViews-powered screens (such as the Pages list and its Quick Edit form) take their configuration from the server. A dynamic filter, `get_entity_view_config_{$kind}_{$name}`, lets you customize that configuration for a specific entity, where the dynamic portions are the entity kind (e.g. `postType`) and name (e.g. `page`), lowercased — so the `postType`/`page` entity maps to the `get_entity_view_config_posttype_page` filter.

Right now, the filter is in use by the following Site Editor screens:

| Page | Filter name |
| --- | --- |
| Pages | `get_entity_view_config_posttype_page` |
| Templates | `get_entity_view_config_posttype_wp_template` |
| Parts | `get_entity_view_config_posttype_wp_template_part` |
| Patterns | `get_entity_view_config_posttype_wp_block` |

There are four aspects to configure for each entity (and screen):

- `default_view`: the default DataViews configuration (e.g., what fields are visible, what is the default sort order, etc.)
- `default_layouts`: the default DataViews layouts (e.g., what layouts are available for the user to choose from)
- `view_list`: the preconfigured views displayed in the sidebar (e.g. "All", "Published", "Drafts", etc.)
- `form`: the DataForm configuration used for the Quick Edit form (e.g. which fields are displayed in the form and their order)

Each filter callback receives a `Gutenberg_View_Config_Data` object with the config for the given entity, which it can change by calling its methods (see below) and **return the object**.

For example, update the view config for the Pages screen by hooking into this filter:

```php
function example_filter_page_view_config( $data ) {
	// Modify the configuration...

	return $data;
}
add_filter( 'get_entity_view_config_posttype_page', 'example_filter_page_view_config' );
```

### Update entries with `merge`

Filter callbacks receive a `Gutenberg_View_Config_Data` object that encodes the current view config for the entity. To update the given configuration, call its `merge( $patch, $version )` method where:

- `$patch`, an array containing the new data to be merged into the existing configuration.
- `$version`, an integer, is the version of the data being merged. It should be `1` for now.

For example, the following filter callback is applied to the _Pages_ screen. It makes the default view type a grid, sorts the grid by ascending title, and makes the `date` field visible (in addition to the existing fields). It also appends `my_custom_field` to the Quick Edit `form`, keeping the form's existing fields (note that registering a field from the server is not yet possible).

```php
function example_filter_page_view_config( $data ) {
	$patch = array(
		'default_view' => array(
			'type'   => 'grid',
			'sort'   => array(
				'field'     => 'title',
				'direction' => 'asc',
			),
			'fields' => array( 'date' ),
		),
		'form'         => array(
			'fields' => array( 'my_custom_field' ),
		),
	);
	$data->merge( $patch, 1 );

	return $data;
}
add_filter( 'get_entity_view_config_posttype_page', 'example_filter_page_view_config' );
```

### Remove entries with `remove`

The `Gutenberg_View_Config_Data` object has a `remove( $spec, $version )` method that allows you to remove entries from the configuration.

- `$spec`, an array that specifies which entries to remove.
- `$version`, an integer, the version of the data being modified. It should be `1` for now.

The following filter callback applies to the _Pages_ screen. It removes the `status` field from the list of visible fields in DataViews, and the `format` field from the Quick Edit form:

```php
function example_page_view_config_remove( $data ) {
	$spec = array(
		'default_view' => array(
			'fields' => array( 'status' ),
		),
		'form'         => array(
			'fields' => array( 'format' ),
		),
	);
	$data->remove( $spec, 1 );

	return $data;
}
add_filter( 'get_entity_view_config_posttype_page', 'example_page_view_config_remove' );
```

### Update entries with `replace`

There's also a `replace( $patch, $version )` method. It works similar to  `merge` except for one difference: how they treat numerical indexed arrays (e.g., `fields => array( 'date', 'author' )`). Where `merge` will add new items to the indexed array, `replace` will substitute the entire list.

For example, this code uses `merge` to add `date` to the list of visible fields and append `my_custom_field` to the Quick Edit form, keeping the current entries in both:

```php
function example_filter_page_view_config( $data ) {
	$patch = array(
		'default_view' => array(
			'fields' => array( 'date' ),
		),
		'form'         => array(
			'fields' => array( 'my_custom_field' ),
		),
	);
	$data->merge( $patch, 1 );

	return $data;
}
add_filter( 'get_entity_view_config_posttype_page', 'example_filter_page_view_config' );
```

However, this code uses `replace` to substitute the list of visible fields with just `date`, and the Quick Edit form's entire field list with `date` and `my_custom_field`:

```php
function example_filter_page_view_config( $data ) {
	$patch = array(
		'default_view' => array(
			'fields' => array( 'date' ),
		),
		'form'         => array(
			'fields' => array( 'date', 'my_custom_field' ),
		),
	);
	$data->replace( $patch, 1 );

	return $data;
}
add_filter( 'get_entity_view_config_posttype_page', 'example_filter_page_view_config' );
```

### Set entries with `set`

There's also a `set( $patch, $version )` method:

- `$patch`, an array containing the new values for the top-level keys it names.
- `$version`, an integer, the version of the data being modified. It should be `1` for now.

Like `merge` and `replace`, `set` only touches the top-level keys the patch names. The difference is depth. Where `merge` and `replace` merge a named key's value into the current one key by key, `set` swaps the whole value in wholesale, dropping whatever the key held before.

Use it when a callback owns a key and wants to pin it to an exact shape, without the inherited default leaking through a key-by-key merge.

For example, this code applied to the _Pages_ screen makes `default_view` and `form` exactly the given configurations, discarding any other properties they had (`default_view`'s page size, filters, etc., and the form's default fields and layout):

```php
function example_filter_page_view_config( $data ) {
	$patch = array(
		'default_view' => array(
			'type'   => 'grid',
			'fields' => array( 'date' ),
		),
		'form'         => array(
			'layout' => array( 'type' => 'panel' ),
			'fields' => array( 'excerpt', 'date', 'my_custom_field' ),
		),
	);
	$data->set( $patch, 1 );

	return $data;
}
add_filter( 'get_entity_view_config_posttype_page', 'example_filter_page_view_config' );
```

## Client-side (Editor) filters

WordPress 6.2 introduced a new client-side filter allowing you to modify block-level [theme.json settings](/docs/reference-guides/theme-json-reference/theme-json-living.md#settings) before the Editor is rendered.

The filter is called `blockEditor.useSetting.before` and can be used in the JavaScript code as follows:

```js
import { addFilter } from '@wordpress/hooks';

/**
 * Limit the Column block's spacing options to pixels.
 */
addFilter(
	'blockEditor.useSetting.before',
	'example/useSetting.before',
	( settingValue, settingName, clientId, blockName ) => {
		if ( blockName === 'core/column' && settingName === 'spacing.units' ) {
			return [ 'px' ];
		}
		return settingValue;
	}
);
```

This example will restrict the available spacing units for the Column block to just pixels. As discussed above, a similar restriction could be applied using theme.json filters or directly in a theme’s theme.json file using block-level settings.

However, the `blockEditor.useSetting.before` filter is unique because it allows you to modify settings according to the block’s location, neighboring blocks, the current user’s role, and more. The possibilities for customization are extensive.

In the following example, text color controls are disabled for the Heading block whenever the block is placed inside of a Media & Text block.

```js
import { select } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';

/**
 * Disable text color controls on Heading blocks when placed inside of Media & Text blocks.
 */
addFilter(
	'blockEditor.useSetting.before',
	'example/useSetting.before',
	( settingValue, settingName, clientId, blockName ) => {
		if ( blockName === 'core/heading' ) {
			const { getBlockParents, getBlockName } =
				select( 'core/block-editor' );
			const blockParents = getBlockParents( clientId, true );
			const inMediaText = blockParents.some(
				( ancestorId ) =>
					getBlockName( ancestorId ) === 'core/media-text'
			);

			if ( inMediaText && settingName === 'color.text' ) {
				return false;
			}
		}

		return settingValue;
	}
);
```

## Block Filters

Beyond curating the Editor itself, there are many ways that you can modify individual blocks. Perhaps you want to disable particular block supports like background color or define which settings should be displayed by default on specific blocks.

One of the most commonly used filters is [`block_type_metadata`](https://developer.wordpress.org/reference/hooks/block_type_metadata/). It allows you to filter the raw metadata loaded from a block's `block.json` file when a block type is registered on the server with PHP.

The filter takes one parameter:

-   `$metadata` (`array`) – metadata loaded from `block.json` for registering a block type.

The `$metadata` array contains everything you might want to know about a block, from its description and [attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/) to block [supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/).

In the following example, background color and gradient support are disabled for Heading blocks.

```php
function example_disable_heading_background_color_and_gradients( $metadata ) {

    // Only apply the filter to Heading blocks.
    if ( ! isset( $metadata['name'] ) || 'core/heading' !== $metadata['name'] ) {
        return $metadata;
    }

    // Check if 'supports' key exists.
    if ( isset( $metadata['supports'] ) && isset( $metadata['supports']['color'] ) ) {

        // Remove Background color and Gradients support.
        $metadata['supports']['color']['background'] = false;
        $metadata['supports']['color']['gradients']  = false;
    }

    return $metadata;
}
add_filter( 'block_type_metadata', 'example_disable_heading_background_color_and_gradients' );
```

You can learn more about the available block filters in the [Block Filters](https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/) documentation.

## Additional resources

-   [How to modify theme.json data using server-side filters](https://developer.wordpress.org/news/2023/07/05/how-to-modify-theme-json-data-using-server-side-filters/) (WordPress Developer Blog)
-   [Curating the Editor experience with client-side filters](https://developer.wordpress.org/news/2023/05/24/curating-the-editor-experience-with-client-side-filters/) (WordPress Developer Blog)
