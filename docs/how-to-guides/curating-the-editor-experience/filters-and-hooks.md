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

DataViews-powered screens (such as the Pages list and its Quick Edit form) build their configuration on the server. A dynamic filter, `get_entity_view_config_{$kind}_{$name}`, lets you customize that configuration for a specific entity, where the dynamic portions are the entity kind (e.g. `postType`) and name (e.g. `page`).

The configuration has four keys: `default_view`, `default_layouts`, `view_list` (the saved views shown in the list), and `form` (the DataForm used by consumers like Quick Edit).

The filter receives an object holding the entity's view configuration. Change the configuration by calling its methods and return the object. Each method merges a partial change (a patch) into one part of the configuration, and patches follow three shared rules: an associative array merges key by key, a numerically indexed array replaces the current value wholesale, and `null` deletes what it names.

-   `update_properties( $patch, $version )` merges into `default_view`, `default_layouts`, and the `form` properties other than its `fields`. Passing `null` for a whole top-level key resets it to its default.
-   `update_view_list_items( $items, $version )` adds, updates, or removes views in the `view_list`, keyed by `slug`: a matching view merges in place, an unknown slug appends a new view to the end, and `null` removes the view.
-   `update_form_fields( $fields, $version )` adds, updates, or removes `form` fields, keyed by `id`. A field is found wherever it lives — at the top level or nested inside a group's `children` — so a patch only needs the id: a matching field merges in place, an unknown id appends a new field, and `null` removes the field. Within a field patch, `children` follows the shared rules: an associative array merges into the group's children by `id` (unknown ids append to the group), a numerically indexed array replaces the children wholesale, and `null` deletes the key.

For form fields, the id always lives in the patch key and the value only carries overrides, so a new field with no overrides is expressed as `'my_field' => array()` — not `array( 'my_field' )`, which is a numerically indexed array and would replace the group's children with just that field. Patch entries apply in order and `null` removes every occurrence of an id, so to move a field into a group, remove it first and append it to the group's `children` later in the same patch.

The `$version` argument declares the configuration schema version the patch was written against (currently `1`), so that a future release that changes the configuration shape can migrate existing patches forward instead of breaking them.

In the following example, a custom saved view is added to the `page` list, the existing Drafts view is retitled, the Trash view is removed, the `grid` layout option is unset, and `slug` and `author` fields are removed from the form.

```php
function example_filter_page_view_config( $data ) {
    // Patch the view list by slug: add a saved view, retitle the existing
    // Drafts view — only the given keys change — and remove the Trash view
    // with null.
    $data->update_view_list_items(
        array(
            'my-drafts' => array(
                'title' => __( 'My drafts', 'example' ),
                'view'  => array(
                    'filters' => array(
                        array(
                            'field'    => 'status',
                            'operator' => 'isAny',
                            'value'    => 'draft',
                            'isLocked' => true,
                        ),
                    ),
                ),
            ),
            'drafts'    => array(
                'title' => __( 'In progress', 'example' ),
            ),
            'trash'     => null,
        ),
        1
    );

    // Patch form fields by id, wherever they live in the form: update the
    // label position of the post content info field, remove the slug and
    // author fields with null, and append a new field to the discussion
    // group's children ( array() carries no overrides ).
    $data->update_form_fields(
        array(
            'post-content-info' => array(
                'layout' => array( 'labelPosition' => 'side' ),
            ),
            'slug'              => null,
            'author'            => null,
            'discussion'        => array(
                'children' => array( 'my_field' => array() ),
            ),
        ),
        1
    );

    // Unset a nested value with null: drop the grid layout option. Form
    // properties other than `fields` also merge here.
    $data->update_properties(
        array(
            'default_layouts' => array( 'grid' => null ),
            'form'            => array( 'layout' => array( 'type' => 'regular' ) ),
        ),
        1
    );

    return $data;
}
add_filter( 'get_entity_view_config_postType_page', 'example_filter_page_view_config' );
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
