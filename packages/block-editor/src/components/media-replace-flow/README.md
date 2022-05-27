# Media replace flow

A component that implements a replacement flow for various media objects. It is used to allow various blocks that use media to have a toolbar button for replacing it. I offers several options, such as:

-   replace from Media Library
-   replace using an URL
-   replace by uploading new media

This component should be used as a child of a `<BlockControls>` component.

## Props

### mediaURL

The URL of the media.

-   Type: `string`
-   Required: Yes

### mediaId

The Id of the attachment post type for the current media.

-   Type: `Int`
-   Required: No

### allowedTypes

A list of media types allowed to replace the current media.

-   Type: `Array`
-   Required: Yes

### accept

Comma delimited list of MIME types accepted for upload.

-   Type: `string`
-   Required: Yes

### onFilesUpload

Callback called before to start to upload the files. It receives an array with the files to upload before to the final process.

### onSelect

Callback used when media is replaced from the Media Library or when a new media is uploaded. It is called with one argument `media` which is an object with all the media details.

-   Type: `func`
-   Required: Yes

### onSelectURL

Callback used when media is replaced with an URL. It is called with one argument `newURL` which is a `string` containing the new URL.

-   Type: `func`
-   Required: Yes

### onError

Callback called when an upload error happens and receives an error message as an argument.

-   Type: `func`
-   Required: No

### name

The label of the replace button.

-   Type: `string`
-   Required: No

### createNotice

Creates a media replace notice.

-   Type: `func`
-   Required: No

### removeNotice

Removes a media replace notice.

-   Type: `func`
-   Required: No

### children

-   Type: `Element`
-   Required: No

If passed, children are rendered inside the dropdown.
