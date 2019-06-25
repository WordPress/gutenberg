# Editor Filters (Experimental)
To modify the behavior of the editor experience, the following Filters are exposed:

### `editor.PostFeaturedImage.imageSize`

Used to modify the image size displayed in the Post Featured Image component. It defaults to `'post-thumbnail'`, and will fail back to the `full` image size when the specified image size doesn't exist in the media object. It's modeled after the `admin_post_thumbnail_size` filter in the classic editor.

_Example:_

```js
var withImageSize = function( size, mediaId, postId ) {
	return 'large';
};

wp.hooks.addFilter( 'editor.PostFeaturedImage.imageSize', 'my-plugin/with-image-size', withImageSize );
```

### `editor.PostPreview.interstitialMarkup`

Filters the interstitial message shown when generating previews.

_Example:_

```js
var customPreviewMessage = function() {
    return '<b>Post preview is being generated!</b>';
};

wp.hooks.addFilter( 'editor.PostPreview.interstitialMarkup', 'my-plugin/custom-preview-message', customPreviewMessage );
```

## Editor settings

### `block_editor_settings`
This is a PHP filter which is applied before sending settings to the WordPress block editor.

You may find details about this filter [on its WordPress Code Reference page](https://developer.wordpress.org/reference/hooks/block_editor_settings/).

The filter will send any setting to the initialized Editor, which means any editor setting that is used to configure the editor at initialisation can be filtered by a PHP WordPress plugin before being sent. 

### Available default editor settings

#### `richEditingEnabled`
If it is `true` the user can edit the content using the Visual Editor.

It is set by default to the return value of the [`user_can_richedit`](https://developer.wordpress.org/reference/functions/user_can_richedit/) function. It checks if the user can access the Visual Editor and whether it’s supported by the user’s browser.


#### `codeEditingEnabled`
Default `true`. Indicates whether the user can access the Code Editor **in addition** to the Visual Editor.

If set to false the user will not be able to switch between Visual and Code editor. The option in the settings menu will not be available and the keyboard shortcut for switching editor types will not fire.  
