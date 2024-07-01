# Enqueueing assets in the Editor

This guide is designed to be the definitive reference for enqueueing assets (scripts and styles) in the Editor. The approaches outlined here represent the recommended practices but keep in mind that this resource will evolve as WordPress does. Updates are encouraged.

As of WordPress 6.3, the Post Editor is iframed if all registered blocks have a [`Block API version 3`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/) or higher and no traditional metaboxes are registered. The Site Editor has always been iframed. This guide assumes you are looking to enqueue assets for the iframed Editor, but refer to the backward compatibility section below for additional considerations.

For more information about why the Editor is iframed, please revisit the post [Blocks in an iframed (template) editor](https://make.wordpress.org/core/2021/06/29/blocks-in-an-iframed-template-editor/).

## The Editor versus Editor content
Before enqueueing assets in the Editor, you must first identify what you are trying to target.

Do you want to add styling or JavaScript to the user-generated content (blocks) in the Editor? Or do you want to modify the Editor user interface (UI) components or interact with Editor APIs? This could include everything from creating custom block controls to registering block variations.

There are different hooks to use depending on the answers to these questions, and if you are building a block or a theme, there are additional approaches to consider. Refer to the designated sections below.

## Scenarios for enqueuing assets
### Editor scripts and styles

Whenever you need to enqueue assets for the Editor itself (i.e. not the user-generated content), you should use the [`enqueue_block_editor_assets`](https://developer.wordpress.org/reference/hooks/enqueue_block_editor_assets/) hook coupled with the standard [`wp_enqueue_script`](https://developer.wordpress.org/reference/functions/wp_enqueue_script/) and [`wp_enqueue_style`](https://developer.wordpress.org/reference/functions/wp_enqueue_style/) functions.

Examples might be adding custom inspector or toolbar controls, registering block styles and variations in JavaScript, registering Editor plugins, etc.

```php
/**
 * Enqueue Editor assets.
 */
function example_enqueue_editor_assets() {
    wp_enqueue_script(
        'example-editor-scripts',
        plugins_url( 'editor-scripts.js', __FILE__ )
    );
    wp_enqueue_style(
        'example-editor-styles',
        plugins_url( 'editor-styles.css', __FILE__ )
    );
}
add_action( 'enqueue_block_editor_assets', 'example_enqueue_editor_assets' );
```

While not the recommended approach, it's important to note that `enqueue_block_editor_assets` can be used to style Editor content for backward compatibility. See below for more details.

### Editor content scripts and styles

As of WordPress 6.3, all assets added through the [`enqueue_block_assets`](https://developer.wordpress.org/reference/hooks/enqueue_block_assets/) PHP action will also be enqueued in the iframed Editor. See [#48286](https://github.com/WordPress/gutenberg/pull/48286) for more details.

This is the primary method you should use to enqueue assets for user-generated content (blocks), and this hook fires both in the Editor and on the front end of your site. It should not be used to add assets intended for the Editor UI or to interact with Editor APIs. See below for a note on backward compatibility.

There are instances where you may only want to add assets in the Editor and not on the front end. You can achieve this by using an [`is_admin()`](https://developer.wordpress.org/reference/functions/is_admin/) check.

```php
/**
 * Enqueue content assets but only in the Editor.
 */
function example_enqueue_editor_content_assets() {
    if ( is_admin() ) {
        wp_enqueue_script(
            'example-editor-content-scripts',
            plugins_url( 'content-scripts.js', __FILE__ )
        );
        wp_enqueue_style(
            'example-editor-content-styles',
            plugins_url( 'content-styles.css', __FILE__ )
        );
    }
}
add_action( 'enqueue_block_assets', 'example_enqueue_editor_content_assets' );
```

You can also use the hook [`block_editor_settings_all`](https://developer.wordpress.org/reference/hooks/block_editor_settings_all/) to modify Editor settings directly. This method is a bit more complicated to implement but provides greater flexibility. It should only be used if `enqueue_block_assets` does not meet your needs.

The following example sets the default text color for all paragraphs to `green`.

```php
/**
 * Modify the Editor settings by adding custom styles.
 *
 * @param array  $editor_settings An array containing the current Editor settings.
 * @param string $editor_context  The context of the editor.
 *
 * @return array Modified editor settings with the added custom CSS style.
 */
function example_modify_editor_settings( $editor_settings, $editor_context ) {
    $editor_settings["styles"][] = array(
        "css" => 'p { color: green }'
    );

    return $editor_settings;
}
add_filter( 'block_editor_settings_all', 'example_modify_editor_settings', 10,2 );
```

These styles are inlined in the `body` of the iframed Editor and prefixed by `.editor-styles-wrapper`. The resulting markup will look like this:

```css
<style>.editor-styles-wrapper p { color: green; }</style>
```

Beginning in WordPress 6.3, you can also use this method of modifying Editor settings to change styles dynamically with JavaScript. See [#52767](https://github.com/WordPress/gutenberg/pull/52767#top) for more details.

### Block scripts and styles

When building a block, `block.json` is the recommended way to enqueue all scripts and styles that are specifically required for the block itself. You are able to enqueue assets for the Editor, the front end, or both. See the [Block Metadata](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/) article for more details.

### Theme scripts and styles

If you need to enqueue Editor JavaScript in a theme, you can use either `enqueue_block_assets` or `enqueue_block_editor_assets` as outlined above. Editor-specific stylesheets should almost always be added with [`add_editor_style()`](https://developer.wordpress.org/reference/functions/add_editor_style/) or [`wp_enqueue_block_style()`](https://developer.wordpress.org/reference/functions/wp_enqueue_block_style/).

The `wp_enqueue_block_style()` function allows you to load per-block stylesheets in the Editor and on the front end. Coupled with `theme.json`, this is one of the best methods of styling blocks. See the WordPress Developer Blog article [Leveraging theme.json and per-block styles for more performant themes](https://developer.wordpress.org/news/2022/12/leveraging-theme-json-and-per-block-styles-for-more-performant-themes/) for more details.

## Backward compatibility and known issues

As a general rule, when you enqueue assets in the iframed Editor, they will also be enqueued when the Editor is not iframed so long as you are using WordPress 6.3+. The opposite is not always true.

Suppose you are building a plugin or theme that requires backward compatibility to 6.2 or lower while maintaining compatibility with WordPress 6.3. In that case, you will not be able to use `enqueue_block_assets` since this hook does not enqueue assets in the content of the iframed Editor prior to 6.3.

As an alternative, you can use `enqueue_block_editor_assets` so long as the enqueued stylesheet contains at least one of the following selectors: `.editor-styles-wrapper`, `.wp-block`, or `.wp-block-*`. A warning message will be logged in the console, but the hook will apply the styles to the content of the Editor.

It’s also important to note that as of WordPress 6.3, assets enqueued by `enqueue_block_assets` are loaded both inside and outside Editor's iframe for backward compatibility. Depending on the script libraries that you are trying to enqueue, this might cause problems. An ongoing discussion about this approach is happening in the Gutenberg [GitHub repository](https://github.com/WordPress/gutenberg/issues/53590).

If you experience issues using any of the methods outlined in this guide that have not been previously reported, please [submit an issue](https://github.com/WordPress/gutenberg/issues/new/choose) on GitHub.
