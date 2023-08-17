# Editor Hooks

To modify the behavior of the editor experience, WordPress exposes several APIs.

## Editor features

The following filters are available to extend the editor features.

### `editor.PostFeaturedImage.imageSize`

Used to modify the image size displayed in the Post Featured Image component. It defaults to `'post-thumbnail'`, and will fail back to the `full` image size when the specified image size doesn't exist in the media object. It's modeled after the `admin_post_thumbnail_size` filter in the classic editor.

_Example:_

```js
var withImageSize = function ( size, mediaId, postId ) {
	return 'large';
};

wp.hooks.addFilter(
	'editor.PostFeaturedImage.imageSize',
	'my-plugin/with-image-size',
	withImageSize
);
```

### `editor.PostPreview.interstitialMarkup`

Filters the interstitial message shown when generating previews.

_Example:_

```js
var customPreviewMessage = function () {
	return '<b>Post preview is being generated!</b>';
};

wp.hooks.addFilter(
	'editor.PostPreview.interstitialMarkup',
	'my-plugin/custom-preview-message',
	customPreviewMessage
);
```

### `media.crossOrigin`

Used to set or modify the `crossOrigin` attribute for foreign-origin media elements (i.e `<audio>` , `<img>` , `<link>` , `<script>`, `<video>`). See this [article](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) for more information the `crossOrigin` attribute, its values and how it applies to each element.

One example of it in action is in the Image block's transform feature to allow cross-origin images to be used in a `<canvas>`.

_Example:_

```js
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

## Editor settings

### `block_editor_settings_all`

_**Note:** Before WordPress 5.8 known as `block_editor_settings`. In the case when you want to support older versions of WordPress you might need a way to detect which filter should be used – the deprecated one vs the new one. The recommended way to proceed is to check if the `WP_Block_Editor_Context` class exists._

This is a PHP filter which is applied before sending settings to the WordPress block editor.

You may find details about this filter [on its WordPress Code Reference page](https://developer.wordpress.org/reference/hooks/block_editor_settings_all/).

The filter will send any setting to the initialized Editor, which means any editor setting that is used to configure the editor at initialiation can be filtered by a PHP WordPress plugin before being sent.

_Example:_

```php
<?php
// my-plugin.php

function filter_block_editor_settings_when_post_provided( $editor_settings, $editor_context ) {
	if ( ! empty( $editor_context->post ) ) {
		$editor_settings['maxUploadFileSize'] = 12345;
	}
	return $editor_settings;
}

add_filter( 'block_editor_settings_all', 'filter_block_editor_settings_when_post_provided', 10, 2 );
```

#### `block_editor_rest_api_preload_paths`

Filters the array of REST API paths that will be used to preloaded common data to use with the block editor.

_Example:_

```php
<?php
// my-plugin.php

function filter_block_editor_rest_api_preload_paths_when_post_provided( $preload_paths, $editor_context ) {
	if ( ! empty( $editor_context->post ) ) {
		array_push( $preload_paths, array( '/wp/v2/blocks', 'OPTIONS' ) );
	}
	return $preload_paths;
}

add_filter( 'block_editor_rest_api_preload_paths', 'filter_block_editor_rest_api_preload_paths_when_post_provided', 10, 2 );
```

### Available default editor settings

#### `richEditingEnabled`

If it is `true` the user can edit the content using the visual editor.

It is set by default to the return value of the [`user_can_richedit`](https://developer.wordpress.org/reference/functions/user_can_richedit/) function. It checks if the user can access the visual editor and whether it’s supported by the user’s browser.

#### `codeEditingEnabled`

Default `true`. Indicates whether the user can access the code editor **in addition** to the visual editor.

If set to false the user will not be able to switch between visual and code editor. The option in the settings menu will not be available and the keyboard shortcut for switching editor types will not fire.

## Logging errors

_**Note:** Since WordPress 6.1._

A JavaScript error in a part of the UI shouldn’t break the whole app. To solve this problem for users, React library uses a concept of an [“error boundary”](https://reactjs.org/docs/error-boundaries.html). Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, and display a fallback UI instead of the component tree that crashed.

### `editor.ErrorBoundary.errorLogged`

Allows you to hook into the [Error Boundaries](https://reactjs.org/docs/error-boundaries.html) and gives you access to the error object.

You can use this action if you want to get hold of the error object that's handled by the boundaries, i.e to send them to an external error tracking tool.

_Example_:

```js
addAction(
	'editor.ErrorBoundary.errorLogged',
	'mu-plugin/error-capture-setup',
	( error ) => {
		// error is the exception's error object
		ErrorCaptureTool.captureError( error );
	}
);
```

## Block Directory

The Block Directory enables installing new block plugins from [WordPress.org.](https://wordpress.org/plugins/browse/block/) It can be disabled by removing the actions that enqueue it. In WordPress core, the function is `wp_enqueue_editor_block_directory_assets`. To remove the feature, use [`remove_action`,](https://developer.wordpress.org/reference/functions/remove_action/) like this:

```php
<?php
// my-plugin.php

remove_action( 'enqueue_block_editor_assets', 'wp_enqueue_editor_block_directory_assets' );
```

## Block Patterns

### `should_load_remote_block_patterns`

Default `true`. The filter is checked when registering remote block patterns, set to false to disable.

For example, to disable use:

```
add_filter( 'should_load_remote_block_patterns', '__return_false' );
```
