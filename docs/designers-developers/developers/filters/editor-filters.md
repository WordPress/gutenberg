# Editor Filters (Experimental)

To modify the behavior of the editor experience, Gutenberg exposes the following Filters:

### `editor.PostFeaturedImage.imageSize`

Used to modify the image size displayed in the Post Featured Image component. It defaults to `'post-thumbnail'`, and will fail back to the `full` image size when the specified image size doesn't exist in the media object. It's modeled after the `admin_post_thumbnail_size` filter in the Classic Editor.

_Example:_

```js
var withImageSize = function( size, mediaId, postId ) {
	return 'large';
};

wp.hooks.addFilter( 'editor.PostFeaturedImage.imageSize', 'my-plugin/with-image-size', withImageSize );
```

