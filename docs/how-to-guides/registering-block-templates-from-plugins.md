# Registering block templates from a plugin

Since WordPress 6.7, plugins can register block templates with the [`register_block_template()`](https://developer.wordpress.org/reference/functions/register_block_template/) function. Registered templates appear in the Site Editor under **Templates**, where users can edit them just like templates that come from the active theme.

This is useful when your plugin adds content that needs its own layout, such as a custom post type archive, a single view for a custom post type, or a custom template users can pick for specific posts.

<div class="callout callout-info">
Themes do not need this API. A block theme adds templates by placing <code>.html</code> files in its <code>/templates</code> folder. At the time of writing, <code>register_block_template()</code> only registers templates. It does not register template parts.
</div>

## Register a template

Call `register_block_template()` on the `init` hook. The function takes a template name and an array of arguments.

```php
add_action( 'init', 'myplugin_register_templates' );

function myplugin_register_templates() {
	register_block_template(
		'myplugin//example',
		array(
			'title'       => __( 'Example', 'myplugin' ),
			'description' => __( 'An example template registered by a plugin.', 'myplugin' ),
			'content'     => '<!-- wp:template-part {"slug":"header","area":"header","tagName":"header"} /-->
<!-- wp:group {"tagName":"main"} -->
<main class="wp-block-group"><!-- wp:post-title /--><!-- wp:post-content /--></main>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","area":"footer","tagName":"footer"} /-->',
		)
	);
}
```

### The template name

The template name uses the format `plugin_uri//template_slug`. The part before `//` is your plugin's namespace, and the part after `//` is the template slug. The double slash is required, and both parts can only contain lowercase letters, numbers, hyphens, and underscores. Registering a name that is invalid or already registered returns a `WP_Error`.

The slug works with the [template hierarchy](https://developer.wordpress.org/themes/basics/template-hierarchy/). If you use a hierarchy slug such as `single-book` or `archive-book`, WordPress uses your template automatically for those requests, as long as the theme does not provide its own version.

### Arguments

| Argument      | Type       | Description                                                                                    |
| ------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `title`       | `string`   | The template title shown in the Site Editor. Defaults to the template name. Make it translatable. |
| `description` | `string`   | The template description shown in the Site Editor. Make it translatable.                      |
| `content`     | `string`   | The default block markup for the template.                                                    |
| `post_types`  | `string[]` | Post types that can select this template as a custom template, for example `array( 'book' )`. |

The function returns a `WP_Block_Template` object on success, or a `WP_Error` object on failure.

## Load the template content from a file

Writing block markup inside a PHP string gets hard to maintain. Instead, keep each template in its own file and load it when you register the template:

```php
function myplugin_get_template_content( $template ) {
	ob_start();
	include __DIR__ . "/templates/{$template}";
	return ob_get_clean();
}

add_action( 'init', 'myplugin_register_templates' );

function myplugin_register_templates() {
	register_block_template(
		'myplugin//archive-book',
		array(
			'title'       => __( 'Book Archive', 'myplugin' ),
			'description' => __( 'Displays an archive of books.', 'myplugin' ),
			'content'     => myplugin_get_template_content( 'archive-book.php' ),
		)
	);
}
```

The `templates/archive-book.php` file contains block markup. Using a PHP file with `include` instead of reading an `.html` file lets you use PHP inside the markup, for example to make strings translatable.

## Offer a custom template for specific post types

Use the `post_types` argument to register a template that users can pick from the **Template** panel when editing a post of that type.

```php
register_block_template(
	'myplugin//book-wide',
	array(
		'title'       => __( 'Book (Wide)', 'myplugin' ),
		'description' => __( 'A full-width layout for single books.', 'myplugin' ),
		'post_types'  => array( 'book' ),
		'content'     => myplugin_get_template_content( 'book-wide.php' ),
	)
);
```

## How themes and users override plugin templates

A plugin template is a default, not a final design:

- If the active theme has a template file with the same slug (for example `templates/archive-book.html`), the theme's template is used instead of the plugin's. The theme's template keeps the plugin's title and description unless the theme defines its own.
- If a user customizes the template in the Site Editor, their saved version is used.

This works the same way as a theme overriding a template that ships with WordPress, so users and theme authors stay in control of the design.

## Unregister a template

Use `unregister_block_template()` with the template name to remove a template that a plugin registered:

```php
add_action( 'init', 'myplugin_unregister_templates', 20 );

function myplugin_unregister_templates() {
	unregister_block_template( 'myplugin//example' );
}
```

This function only removes templates registered with `register_block_template()`. It cannot remove theme templates or templates that users have saved.

## Further reading

- [New Plugin Template Registration API in WordPress 6.7](https://make.wordpress.org/core/2024/10/20/new-plugin-template-registration-api-in-wordpress-6-7/) (dev note)
- [Registering block templates via plugins in WordPress 6.7](https://developer.wordpress.org/news/2024/08/registering-block-templates-via-plugins-in-wordpress-6-7/) (WordPress Developer Blog)
- [`register_block_template()`](https://developer.wordpress.org/reference/functions/register_block_template/) function reference
