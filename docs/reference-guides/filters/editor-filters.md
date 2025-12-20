# Editor Hooks

WordPress exposes several APIs that allow you to modify the editor experience.

## Editor settings

One of the most common ways to modify the Editor is through the [`block_editor_settings_all`](https://developer.wordpress.org/reference/hooks/block_editor_settings_all/) PHP filter, which is applied before settings are sent to the initialized Editor. This filter allows plugin and theme authors extensive control over how the Editor behaves.

<div class="callout callout-warning">
	Before WordPress 5.8, this hook was known as <code>block_editor_settings</code>, which is now deprecated. If you need to support older versions of WordPress, you might need a way to detect which filter should be used. You can check if <code>block_editor_settings</code> is safe to use by seeing if the <code>WP_Block_Editor_Context</code> class exists, which was introduced in 5.8.
</div>

The `block_editor_settings_all` hook passes two parameters to the callback function:

- `$settings` – An array of configurable settings for the Editor.
- `$context` – An instance of [`WP_Block_Editor_Context`](https://developer.wordpress.org/reference/classes/wp_block_editor_context/), an object that contains information about the current Editor.

The following example modifies the maximum upload file size. Add this to a plugin or your theme's `functions.php` file to test it.

```php
add_filter( 'block_editor_settings_all', 'example_filter_block_editor_settings_when_post_provided', 10, 2 );

function example_filter_block_editor_settings_when_post_provided( $editor_settings, $editor_context ) {
	if ( ! empty( $editor_context->post ) ) {
		$editor_settings['maxUploadFileSize'] = 12345;
	}
	return $editor_settings;
}
```

There are dozens of editor settings, too many to list in this documentation article, but here are a few examples of what you can do with the `block_editor_settings_all` filter.

<div class="callout callout-info">
	To view all available settings, open the Editor and then open the console in your browser's <a href="https://developer.wordpress.org/advanced-administration/debug/debug-javascript/#open-the-developer-tools">Developer Tools</a>. Enter the command <code>wp.data.select( 'core/block-editor' ).getSettings()</code> to display the current values for all Editor settings.
</div>

### Restrict code editor access

The `codeEditingEnabled`, which defaults to `true`, controls whether the user can access the code editor **in addition** to the visual editor. There may be instances where you don't want certain users to be able to access this view.

If this setting is set to `false`, the user will not be able to switch between visual and code editor. The option in the settings menu will not be available, and the keyboard shortcut for switching editor types will not fire. Here's an example:

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

### Restrict visual editor access

Similar to the `codeEditingEnabled` setting, `richEditingEnabled` allows you to control who can access the visual editor. If `true`, the user can edit the content using the visual editor.

The setting defaults to the returned value of the [`user_can_richedit`](https://developer.wordpress.org/reference/functions/user_can_richedit/) function. It checks whether the user can access the visual editor and whether the user's browser supports it.

### Set a default image size

Images are set to the `large` image size by default in the Editor. You can modify this using the `imageDefaultSize` setting, which is especially useful if you have configured your own custom image sizes. The following example changes the default image size to `medium`.

```php
add_filter( 'block_editor_settings_all', 'example_set_default_image_size' );

function example_set_default_image_size( $settings ) {
	$settings['imageDefaultSize'] = 'medium';
	return $settings;
}
```

### Disable Openverse

The [Openverse](https://openverse.org/) integration is enabled for all WordPress sites by default and is controlled by the `enableOpenverseMediaCategory` setting. To disable Openverse, apply the following filter:

```php
add_filter( 'block_editor_settings_all', 'example_disable_openverse' );

function example_disable_openverse( $settings ) {
	$settings['enableOpenverseMediaCategory'] = false;
	return $settings;
}
```

### Disable the Font Library

The Font Library allows users to install new fonts on their site, which is enabled by default and is controlled by the `fontLibraryEnabled` setting. To disable the Font Library, apply the following filter:

```php
add_filter( 'block_editor_settings_all', 'example_disable_font_library' );

function example_disable_font_library( $settings ) {
	$settings['fontLibraryEnabled'] = false;
	return $settings;
}
```

### Disable block inspector tabs

Most blocks display [two tabs](https://make.wordpress.org/core/2023/03/07/introduction-of-block-inspector-tabs/) in the Inspector, one for Settings and another for Styles. You can disable these tabs using the `blockInspectorTabs` setting.

```php
add_filter( 'block_editor_settings_all', 'example_disable_inspector_tabs_by_default' );

function example_disable_inspector_tabs_by_default( $settings ) {
	$settings['blockInspectorTabs'] = array( 'default' => false );
	return $settings;
}
```

You can also modify which blocks have inspector tabs. Here's an example that disables tabs for a specific block.

```php
add_filter( 'block_editor_settings_all', 'example_disable_tabs_for_my_custom_block' );

function example_disable_tabs_for_my_custom_block( $settings ) {
	$current_tab_settings = _wp_array_get( $settings, array( 'blockInspectorTabs' ), array() );
	$settings['blockInspectorTabs'] = array_merge(
		$current_tab_settings,
		array( 'my-plugin/my-custom-block' => false )
	);

	return $settings;
}
```

## Block Directory

The Block Directory allows users to install new block plugins directly in the Editor from the WordPress.org [Plugin Directory](https://wordpress.org/plugins/browse/block/). You can disable this functionality by removing the action that enqueues it, which is `wp_enqueue_editor_block_directory_assets`. To do so, use [`remove_action`](https://developer.wordpress.org/reference/functions/remove_action/) like this:

```php
remove_action( 'enqueue_block_editor_assets', 'wp_enqueue_editor_block_directory_assets' );
```

## Block patterns

Remote patterns, such as those from the WordPress.org [Pattern Directory](https://wordpress.org/patterns/), are available to users by default in the Editor. This functionality is controlled by `should_load_remote_block_patterns`, which defaults to `true`. You can disable remote patterns by setting the filter to false (`__return_false`).

```php
add_filter( 'should_load_remote_block_patterns', '__return_false' );
```

## Editor features

The following filters are available to extend features in the Editor.

### `editor.PostFeaturedImage.imageSize`

You can use this filter to modify the image size displayed in the Post Featured Image component. It defaults to `'post-thumbnail'` and will fail back to the `full` image size when the specified image size doesn't exist in the media object. It's modeled after the `admin_post_thumbnail_size` filter in the Classic Editor.

```js
import { addFilter } from '@wordpress/hooks';

const withImageSize = function ( size, mediaId, postId ) {
	return 'large';
};

addFilter(
	'editor.PostFeaturedImage.imageSize',
	'my-plugin/with-image-size',
	withImageSize
);
```

### `editor.PostPreview.interstitialMarkup`

You can also filter the interstitial message shown when generating previews. Here's an example:

```js
import { addFilter } from '@wordpress/hooks';

const customPreviewMessage = function () {
	return '<b>Post preview is being generated!</b>';
};

addFilter(
	'editor.PostPreview.interstitialMarkup',
	'my-plugin/custom-preview-message',
	customPreviewMessage
);
```

### `media.crossOrigin`

This filter is used to set or modify the `crossOrigin` attribute for foreign-origin media elements (i.e., `<audio>`, `<img>`, `<link>`, `<script>`, `<video>`). See this [article](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) for more information on the `crossOrigin` attribute, its values, and how it applies to each element.

One example of it in action is in the Image block's transform feature to allow cross-origin images to be used in a `<canvas>`. Here's an example:

```js
import { addFilter } from '@wordpress/hooks';

addFilter(
	'media.crossOrigin',
	'my-plugin/with-cors-media',
	// The callback accepts a second `mediaSrc` argument which references
	// the url to actual foreign media, useful if you want to decide
	// the value of crossOrigin based upon it.
	( crossOrigin, mediaSrc ) => {
		if ( mediaSrc.startsWith( 'https://example.com' ) ) {
			return 'use-credentials';
		}
		return crossOrigin;
	}
);
```

## Editor REST API preload paths

You can use [`block_editor_rest_api_preload_paths`](https://developer.wordpress.org/reference/hooks/block_editor_rest_api_preload_paths/) to filter the array of REST API paths that will be used to preload common data to use with the block editor. Here's an example:

```php
add_filter( 'block_editor_rest_api_preload_paths', 'example_filter_block_editor_rest_api_preload_paths_when_post_provided', 10, 2 );

function example_filter_block_editor_rest_api_preload_paths_when_post_provided( $preload_paths, $editor_context ) {
	if ( ! empty( $editor_context->post ) ) {
		array_push( $preload_paths, array( '/wp/v2/blocks', 'OPTIONS' ) );
	}
	return $preload_paths;
}
```

## Logging errors

A JavaScript error in a part of the UI shouldn't break the whole app. To solve this problem for users, React library uses the concept of an ["error boundary"](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary). Error boundaries are React components that catch JavaScript errors anywhere in their child component tree and display a fallback UI instead of the component tree that crashed.

The `editor.ErrorBoundary.errorLogged` action allows you to hook into the [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) and gives you access to the error object.

You can use this action to get hold of the error object handled by the boundaries. For example, you may want to send them to an external error-tracking tool. Here's an example:

```js
import { addAction } from '@wordpress/hooks';

addAction(
	'editor.ErrorBoundary.errorLogged',
	'mu-plugin/error-capture-setup',
	( error ) => {
		// Error is the exception's error object. 
		// You can console.log it or send it to an external error-tracking tool.
		console.log ( error );
	}
);
```
