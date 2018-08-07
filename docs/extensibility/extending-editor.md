# Extending Editor (Experimental)

[Hooks](https://developer.wordpress.org/plugins/hooks/) are a way for one piece of code to interact/modify another piece of code. They make up the foundation for how plugins and themes interact with Gutenberg, but they’re also used extensively by WordPress Core itself. There are two types of hooks: [Actions](https://developer.wordpress.org/plugins/hooks/actions/) and [Filters](https://developer.wordpress.org/plugins/hooks/filters/). They were initially implemented in PHP, but for the purpose of Gutenberg they were ported to JavaScript and published to npm as [@wordpress/hooks](https://www.npmjs.com/package/@wordpress/hooks) package for general purpose use. You can also learn more about both APIs: [PHP](https://codex.wordpress.org/Plugin_API/) and [JavaScript](https://github.com/WordPress/packages/tree/master/packages/hooks).

## Modifying Editor

To modify the behavior of the editor experience, Gutenberg exposes the following Filters:

### `editor.PostFeaturedImage.imageSize`

Used to modify the image size displayed in the Post Featured Image component. It defaults to `'post-thumbnail'`, and will fail back to the `full` image size when the specified image size doesn't exist in the media object. It's modeled after the `admin_post_thumbnail_size` filter in the Classic Editor.

_Example:_

```
var withImageSize = function( size, mediaId, postId ) {
	return 'large';
};

wp.hooks.addFilter( 'editor.PostFeaturedImage.imageSize', 'my-plugin/with-image-size', withImageSize );
```
