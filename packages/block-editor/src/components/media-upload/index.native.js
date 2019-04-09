/**
 * External dependencies
 */
import React from 'react';
import {
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/block-editor';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';

const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE = 'choose_from_device';
const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA = 'take_media';
const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY = 'wordpress_media_library';

class MediaUpload extends React.Component {
	getTakeMediaLabel() {
		const { mediaType } = this.props;

		if ( mediaType === MEDIA_TYPE_IMAGE ) {
			return __( 'Take a Photo' );
		} else if ( mediaType === MEDIA_TYPE_VIDEO ) {
			return __( 'Take a Video' );
		}
	}

	getMediaOptionsItems() {
		return [
			{ icon: 'format-image', value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE, label: __( 'Choose from device' ) },
			{ icon: 'camera', value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA, label: this.getTakeMediaLabel() },
			{ icon: 'wordpress-alt', value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY, label: __( 'WordPress Media Library' ) },
		];
	}

	render() {
		const { mediaType } = this.props;

		const onMediaLibraryButtonPressed = () => {
			requestMediaPickFromMediaLibrary( [ mediaType ], ( mediaId, mediaUrl, thumbnailUrl) => {
				if ( mediaId ) {
					this.props.onSelectURL( mediaId, mediaUrl, thumbnailUrl );
				}
			} );
		};

		const onMediaUploadButtonPressed = () => {
			requestMediaPickFromDeviceLibrary( [ mediaType ], ( mediaId, mediaUrl, thumbnailUrl ) => {
				if ( mediaId ) {
					this.props.onSelectURL( mediaId, mediaUrl, thumbnailUrl);
				}
			} );
		};

		const onMediaCaptureButtonPressed = () => {
			requestMediaPickFromDeviceCamera( [ mediaType ], ( mediaId, mediaUrl, thumbnailUrl ) => {
				if ( mediaId ) {
					this.props.onSelectURL( mediaId, mediaUrl, thumbnailUrl);
				}
			} );
		};

		const mediaOptions = this.getMediaOptionsItems();

		let picker;

		const onPickerPresent = () => {
			picker.presentPicker();
		};

		const getMediaOptions = () => (
			<Picker
				hideCancelButton={ true }
				ref={ ( instance ) => picker = instance }
				options={ mediaOptions }
				onChange={ ( value ) => {
					if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE ) {
						onMediaUploadButtonPressed();
					} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA ) {
						onMediaCaptureButtonPressed();
					} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY ) {
						onMediaLibraryButtonPressed();
					}
				} }
			/>
		);
		return this.props.render( { open: onPickerPresent, getMediaOptions } );
	}
}

export default MediaUpload;
