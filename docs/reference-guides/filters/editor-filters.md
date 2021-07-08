# Editor Filters

To modify the behavior of the editor experience, the following Filters are exposed:

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

Used to set or modify the `crossOrigin` attribute for foreign-origin media elements (i.e `<img>`, `<audio>` , `<img>` , `<link>` , `<script>`, `<video>`). See this [article](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) for more information the `crossOrigin` attribute, its values and how it applies to each element.

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

### `block_editor_settings`

This is a PHP filter which is applied before sending settings to the WordPress block editor.

You may find details about this filter [on its WordPress Code Reference page](https://developer.wordpress.org/reference/hooks/block_editor_settings/).

The filter will send any setting to the initialized Editor, which means any editor setting that is used to configure the editor at initialisation can be filtered by a PHP WordPress plugin before being sent.

### Available default editor settings

#### `richEditingEnabled`

If it is `true` the user can edit the content using the visual editor.

It is set by default to the return value of the [`user_can_richedit`](https://developer.wordpress.org/reference/functions/user_can_richedit/) function. It checks if the user can access the visual editor and whether it’s supported by the user’s browser.

#### `codeEditingEnabled`

Default `true`. Indicates whether the user can access the code editor **in addition** to the visual editor.

If set to false the user will not be able to switch between visual and code editor. The option in the settings menu will not be available and the keyboard shortcut for switching editor types will not fire.

### Block Directory

The Block Directory enables installing new block plugins from [WordPress.org.](https://wordpress.org/plugins/browse/block/) It can be disabled by removing the actions that enqueue it. In WordPress core, the function is `wp_enqueue_editor_block_directory_assets`, and Gutenberg uses `gutenberg_enqueue_block_editor_assets_block_directory`. To remove the feature, use [`remove_action`,](https://developer.wordpress.org/reference/functions/remove_action/) like this:

```php
remove_action( 'enqueue_block_editor_assets', 'wp_enqueue_editor_block_directory_assets' );
remove_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_block_editor_assets_block_directory' );
```
