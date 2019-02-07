# Editor Filters (Experimental)

To modify the behavior of the editor experience, the following Filters are exposed:

### `editor.PostFeaturedImage.imageSize`

Used to modify the image size displayed in the Post Featured Image component. It defaults to `'post-thumbnail'`, and will fail back to the `full` image size when the specified image size doesn't exist in the media object. It's modeled after the `admin_post_thumbnail_size` filter in the Classic Editor.

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

## `editor.updatePost`

Used to perform other steps before, during or after the post update process.

The filter recieves a function `updatePost` that when called triggers the post update. It should return a function that wraps `updatePost` (or returns `updatePost` itself if no actions need to be performed).

_Example:_

```js
var updatePostFilter = function( updatePost ) {
	return function() {
		// make an API request prior to updating the post.
		myApiRequest().then( updatePost );
	};
};

wp.hooks.addFilter( 'editor.updatePost', 'my-plugin/update-post-filter', updatePostFilter );
```
