MediaUpload
===========

MediaUpload is a React component used to render a button that opens the WordPress media modal.

## Setup

This is a placeholder component necessary to make it possible to provide an integration with the core blocks that handle media files. By default it renders nothing but it provides a way to have it overridden with the `components.MediaUpload` filter.

```jsx
import { addFilter } from '@wordpress/hooks';
import MediaUpload from './media-upload';

const replaceMediaUpload = () => MediaUpload;

addFilter(
	'editor.MediaUpload',
	'core/edit-post/components/media-upload/replace-media-upload',
	replaceMediaUpload
);
```

You can check how this component is implemented for the edit post page using `wp.media` module in [edit-post](https://github.com/WordPress/gutenberg/tree/master/packages/edit-post/src/hooks/components/media-upload/index.js).

## Usage

To make sure the current user has Upload permissions, you need to wrap the MediaUpload component into the MediaUploadCheck one.

```jsx
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

function MyMediaUploader() {
	return (
		<MediaUploadCheck>
			<MediaUpload
				onSelect={ ( media ) => console.log( 'selected ' + media.length ) }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				value={ mediaId }
				render={ ( { open } ) => (
					<Button onClick={ open }>
						Open Media Library
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}
```

## Props

The component accepts the following props. Props not included in this set will be applied to the element wrapping Popover content.

### allowedTypes

Array with the types of the media to upload/select from the media library.
Each type is a string that can contain the general mime type e.g: 'image', 'audio', 'text',
or the complete mime type e.g: 'audio/mpeg', 'image/gif'.
If allowedTypes is unset all mime types should be allowed.

- Type: `Array`
- Required: No

### multiple

Whether to allow multiple selections or not.

- Type: `Boolean`
- Required: No
- Default: false

### value

Media ID (or media IDs if multiple is true) to be selected by default when opening the media library.

- Type: `Number|Array`
- Required: No

### onSelect

Callback called when the media modal is closed, the selected media are passed as an argument.

- Type: `Function`
- Required: Yes

### title

Title displayed in the media modal.

- Type: `String`
- Required: No
- Default: `Select or Upload Media`

### modalClass

CSS class added to the media modal frame.

- Type: `String`
- Required: No


### addToGallery

If true, the gallery media modal opens directly in the media library where the user can add additional images.
If false the gallery media modal opens in the edit mode where the user can edit existing images, by reordering them, remove them, or change their attributes.
Only applies if `gallery === true`.

- Type: `Boolean`
- Required: No
- Default: `false`

### gallery

If true, the component will initiate all the states required to represent a gallery. By default, the media modal opens in the gallery edit frame, but that can be changed using the `addToGallery`flag.

- Type: `Boolean`
- Required: No
- Default: `false`

## render

A callback invoked to render the Button opening the media library.

- Type: `Function`
- Required: Yes

The first argument of the callback is an object containing the following properties:

 - `open`: A function opening the media modal when called
