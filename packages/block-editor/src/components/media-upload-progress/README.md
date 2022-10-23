# MediaUploadProgress

`MediaUploadProgress` shows a progress bar while a media file associated with a block is being uploaded.

## Usage

Usage example

```jsx
import { ImageBackground, Text, View } from 'react-native';
import { MediaUploadProgress } from '@wordpress/block-editor';

function MediaProgress( { url, id } ) {
	return (
		<MediaUploadProgress
			mediaId={ id }
			renderContent={ ( { isUploadFailed, retryMessage } ) => {
				return (
					<ImageBackground
						resizeMethod="scale"
						source={ { uri: url } }
					>
						{ isUploadFailed && (
							<View>
								<Text>{ retryMessage }</Text>
							</View>
						) }
					</ImageBackground>
				);
			} }
		/>
	);
}
```

## Props

### mediaId

A media ID that identifies the current upload.

-   Type: `Number`
-   Required: Yes
-   Platform: Mobile

### renderContent

Content to be rendered along with the progress bar, usually the thumbnail of the media being uploaded.

-   Type: `React components`
-   Required: Yes
-   Platform: Mobile

It passes an object containing the following properties:

`{ isUploadInProgress, isUploadFailed, retryMessage }`

### onUpdateMediaProgress

Callback called when the progress of the upload is updated.

-   Type: `Function`
-   Required: No
-   Platform: Mobile

The argument of the callback is an object containing the following properties:

`{ mediaId, mediaUrl, progress, state }`

### onFinishMediaUploadWithSuccess

Callback called when the media file has been uploaded successfully.

-   Type: `Function`
-   Required: No
-   Platform: Mobile

The argument of the callback is an object containing the following properties:

`{ mediaId, mediaServerId, mediaUrl, progress, state }`

### onFinishMediaUploadWithFailure

Callback called when the media file couldn't be uploaded.

-   Type: `Function`
-   Required: No
-   Platform: Mobile

The argument of the callback is an object containing the following properties:

`{ mediaId, progress, state }`

### onMediaUploadStateReset

Callback called when the media upload is reset

-   Type: `Function`
-   Required: No
-   Platform: Mobile
