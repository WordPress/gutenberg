# Customizing template information

The Site Editor's Templates screen lists every template available to the site along with its title and description. This information comes from several places on the server, and each of them can be adjusted from a theme or plugin using PHP.

This guide explains where template titles and descriptions come from and how to change them, for example to rewrite the descriptions of core templates, add branding, or keep descriptions to a consistent length.

## Where template information comes from

Templates shown in the Site Editor can come from four sources:

-   **Default template types** such as `index`, `single`, `page`, or `404`. WordPress defines a title and description for each of them in [`get_default_block_template_types()`](https://developer.wordpress.org/reference/functions/get_default_block_template_types/). These are used for any template file whose slug matches a default type.
-   **Custom templates provided by a theme**, declared in the `customTemplates` section of `theme.json`.
-   **Templates registered by a plugin** with [`register_block_template()`](https://developer.wordpress.org/reference/functions/register_block_template/) (WordPress 6.7 and later).
-   **Templates created or customized by users** in the Site Editor, which are stored in the database as `wp_template` posts. Their description is stored in the post excerpt.

All of these are returned as `WP_Block_Template` objects through `get_block_templates()` and `get_block_template()`, which is what the REST API, and therefore the Site Editor, uses.

## Changing the information of default template types

Use the `default_template_types` filter to change the title or description of any default template type. The filter receives an array keyed by template slug, where each entry has a `title` and a `description`.

```php
function myplugin_default_template_types( $template_types ) {
	if ( isset( $template_types['404'] ) ) {
		$template_types['404']['description'] = __(
			'Shown when a visitor follows a broken link. Include a search form and links to popular content.',
			'myplugin'
		);
	}

	return $template_types;
}
add_filter( 'default_template_types', 'myplugin_default_template_types' );
```

The filter can also be used to add a title and description for a template slug that is not part of the defaults. Any template file in the theme with a matching slug will use them.

```php
function myplugin_add_template_type( $template_types ) {
	$template_types['landing'] = array(
		'title'       => _x( 'Landing', 'Template name', 'myplugin' ),
		'description' => __( 'Used for campaign landing pages.', 'myplugin' ),
	);

	return $template_types;
}
add_filter( 'default_template_types', 'myplugin_add_template_type' );
```

<div class="callout callout-info">
	Titles and descriptions from <code>default_template_types</code> are applied to template files provided by the theme. Once a user customizes a template in the Site Editor, the saved version keeps its own title and description.
</div>

## Setting the information of custom templates

### Theme templates

Themes give custom templates a title through the `customTemplates` section of `theme.json`. The `name` must match the file name of the template in the theme's `templates` folder, without the extension.

```json
{
	"version": 3,
	"customTemplates": [
		{
			"name": "page-no-title",
			"title": "Page without title",
			"postTypes": [ "page" ]
		}
	]
}
```

`customTemplates` does not support a description. To give a theme's custom template a description, add an entry for its slug with the `default_template_types` filter as shown above.

### Plugin templates

Plugins set a title and description directly when registering a template:

```php
function myplugin_register_templates() {
	register_block_template(
		'myplugin//event-archive',
		array(
			'title'       => __( 'Event archive', 'myplugin' ),
			'description' => __( 'Lists upcoming and past events.', 'myplugin' ),
			'content'     => '<!-- wp:template-part {"slug":"header"} /--><!-- wp:query /-->',
		)
	);
}
add_action( 'init', 'myplugin_register_templates' );
```

## Changing the information of every template

To modify information for all templates, filter the template objects themselves with the `get_block_templates` and `get_block_template` filters. Both filters also run for template parts, so check the template type before changing anything.

`get_block_templates` runs for every template returned in a list, including templates saved by users, and is what the Templates screen uses. `get_block_template` runs when a single template is loaded, but only for templates that come from files. Templates saved by users are returned from the database without passing through it.

The following example keeps every template description to a maximum of 20 words:

```php
function myplugin_trim_template_description( $template ) {
	if ( $template instanceof WP_Block_Template && ! empty( $template->description ) ) {
		$template->description = wp_trim_words( $template->description, 20 );
	}

	return $template;
}

function myplugin_filter_block_templates( $query_result, $query, $template_type ) {
	if ( 'wp_template' !== $template_type ) {
		return $query_result;
	}

	return array_map( 'myplugin_trim_template_description', $query_result );
}
add_filter( 'get_block_templates', 'myplugin_filter_block_templates', 10, 3 );

function myplugin_filter_block_template( $block_template, $id, $template_type ) {
	if ( 'wp_template' !== $template_type ) {
		return $block_template;
	}

	return myplugin_trim_template_description( $block_template );
}
add_filter( 'get_block_template', 'myplugin_filter_block_template', 10, 3 );
```

The same approach can be used to prepend or append text to descriptions, or to fill in a description for templates that don't have one.

<div class="callout callout-warning">
	These filters change the data returned to every consumer, including the REST API. When a user customizes a theme template for the first time, the filtered description is saved to the database along with it, and is then filtered again whenever it is read. Prefer changes that produce the same result when applied more than once, such as trimming, and avoid appending text unconditionally.
</div>

## Limitations

The columns and fields displayed on the Templates screen cannot currently be added, removed, or rearranged by plugins. Follow [#70934](https://github.com/WordPress/gutenberg/issues/70934) for progress on extending the Templates screen.
