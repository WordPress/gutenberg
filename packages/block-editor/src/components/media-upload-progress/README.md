MediaUploadProgress
===========

`MediaUploadProgress` is a React component used to show a progress bar while a media file associated with a block is being uploaded.

## Usage

Usage example

```
import {
	MediaUploadProgress,
} from '@wordpress/block-editor';

...
    <MediaUploadProgress
        height={ height }
        width={ width }
        coverUrl={ url }
        mediaId={ id }
        onUpdateMediaProgress={ this.updateMediaProgress }
        onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
        onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
        onMediaUploadStateReset={ this.mediaUploadStateReset }
        renderContent={ ( isUploadFailed, finalWidth, finalHeight, retryMessage } ) => {
            return (
                <ImageBackground
                    style={ { width: finalWidth, height: finalHeight } }
                    resizeMethod="scale"
                    source={ { uri: url } }
                >
                    { isUploadFailed &&
                        <View style={ styles.imageContainer } >
                            <Text style={ styles.uploadFailedText }>{ retryMessage }</Text>
                        </View>
                    }
                </ImageBackground>
            );
        } }
    />
...
```

## Props

### mediaId

A media ID that identifies the current upload.

- Type: `Number`
- Required: Yes
- Platform: Native

### coverUrl

By passing an image url, it'll calculate the right size depending on the container of the component maintaining its aspect ratio, it'll pass these values through `renderContent`.

- Type: `String`
- Required: No
- Platform: Native

### renderContent

Content to be rendered along with the progress bar, usually the thumbnail of the media being uploaded.

- Type: `React components`
- Required: Yes
- Platform: Native

It passes an object containing the following properties:

**With** `coverUrl` as a parameter:

`{ isUploadInProgress, isUploadFailed, finalWidth, finalHeight, imageWidthWithinContainer, retryMessage }`

**Without** `coverUrl` as a parameter:

`{ isUploadInProgress, isUploadFailed, retryMessage }`


### width

Forces the final width to be returned in `finalWidth`

- Type: `Number`
- Required: No
- Platform: Native

### height

Forces the final height to be returned in `finalHeight`

- Type: `Number`
- Required: No
- Platform: Native

### onUpdateMediaProgress

Callback called when the progress of the upload is updated.

- Type: `Function`
- Required: No
- Platform: Native

The argument of the callback is an object containing the following properties:

`{ mediaId, mediaUrl, progress, state }`

### onFinishMediaUploadWithSuccess

Callback called when the media file has been uploaded successfully.

- Type: `Function`
- Required: No
- Platform: Native

The argument of the callback is an object containing the following properties:

`{ mediaId, mediaServerId, mediaUrl, progress, state }`

### onFinishMediaUploadWithFailure

Callback called when the media file couldn't be uploaded.

- Type: `Function`
- Required: No
- Platform: Native

The argument of the callback is an object containing the following properties:

`{ mediaId, progress, state }`


### onMediaUploadStateReset

Callback called when the media upload is reset

- Type: `Function`
- Required: No
- Platform: Native

