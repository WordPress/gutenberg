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
import { Picker } from '@wordpress/components';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';

export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE = 'choose_from_device';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA = 'take_media';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY = 'wordpress_media_library';

export const OPTION_TAKE_VIDEO = __( 'Take a Video' );
export const OPTION_TAKE_PHOTO = __( 'Take a Photo' );

export class MediaUpload extends React.Component {
	getTakeMediaLabel() {
		const { mediaType } = this.props;

		if ( mediaType === MEDIA_TYPE_IMAGE ) {
			return OPTION_TAKE_PHOTO;
		} else if ( mediaType === MEDIA_TYPE_VIDEO ) {
			return OPTION_TAKE_VIDEO;
		}
	}

	getMediaOptionsItems() {
		return [
			{ icon: this.getChooseFromDeviceIcon(), value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE, label: __( 'Choose from device' ) },
			{ icon: this.getTakeMediaIcon(), value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA, label: this.getTakeMediaLabel() },
			{ icon: this.getWordPressLibraryIcon(), value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY, label: __( 'WordPress Media Library' ) },
		];
	}

	getChooseFromDeviceIcon() {
		const { mediaType } = this.props;

		if ( mediaType === MEDIA_TYPE_IMAGE ) {
			return 'format-image';
		} else if ( mediaType === MEDIA_TYPE_VIDEO ) {
			return 'format-video';
		}
	}

	getTakeMediaIcon() {
		return 'camera';
	}

	getWordPressLibraryIcon() {
		return 'wordpress-alt';
	}

	render() {
		const { mediaType } = this.props;

		const onMediaLibraryButtonPressed = () => {
			requestMediaPickFromMediaLibrary( [ mediaType ], ( mediaId, mediaUrl ) => {
				if ( mediaId ) {
					this.props.onSelectURL( mediaId, mediaUrl );
				}
			} );
		};

		const onMediaUploadButtonPressed = () => {
			requestMediaPickFromDeviceLibrary( [ mediaType ], ( mediaId, mediaUrl ) => {
				if ( mediaId ) {
					this.props.onSelectURL( mediaId, mediaUrl );
				}
			} );
		};

		const onMediaCaptureButtonPressed = () => {
			requestMediaPickFromDeviceCamera( [ mediaType ], ( mediaId, mediaUrl ) => {
				if ( mediaId ) {
					this.props.onSelectURL( mediaId, mediaUrl );
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
