# BlockMediaUpdateProgress

`BlockMediaUpdateProgress` shows a progress bar while the media files associated with a media-containing block are being saved first and uploaded later

## Usage

Usage example

```jsx
import { ImageBackground, Text, View } from 'react-native';
import { BlockMediaUpdateProgress } from '@wordpress/block-editor';

function BlockUpdatingProgress( { url, id } ) {
	return (
		<BlockMediaUpdateProgress
			mediaId={ id }
			renderContent={ ( { isSaveFailed, retryMessage } ) => {
				return (
					<ImageBackground
						resizeMethod="scale"
						source={ { uri: url } }
					>
						{ isSaveFailed && (
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

### mediaFiles

A collection of media ID that identifies the current collection of files represented in this media container block.

-   Type: `Array`
-   Required: Yes
-   Platform: Mobile

### renderContent

Content to be rendered along with the progress bar, usually the thumbnail of the media being uploaded.

-   Type: `React components`
-   Required: Yes
-   Platform: Mobile

It passes an object containing the following properties:

`{ isUploadInProgress, isUploadFailed, isSaveInProgress, isSaveFailed, retryMessage }`

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
