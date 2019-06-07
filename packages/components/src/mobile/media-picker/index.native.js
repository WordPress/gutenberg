/**
 * External dependencies
 */
import {
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Picker } from '@wordpress/components';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';

export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE = 'choose_from_device';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA = 'take_media';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY = 'wordpress_media_library';

export const OPTION_TAKE_VIDEO = __( 'Take a Video' );
export const OPTION_TAKE_PHOTO = __( 'Take a Photo' );

export class MediaPicker extends Component {
	constructor() {
		super( ...arguments );

		this.onMediaLibraryButtonPressed = this.onMediaLibraryButtonPressed.bind( this );
		this.onMediaUploadButtonPressed = this.onMediaUploadButtonPressed.bind( this );
		this.onMediaCaptureButtonPressed = this.onMediaCaptureButtonPressed.bind( this );
	}

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

	onMediaLibraryButtonPressed() {
		const { mediaType } = this.props;

		requestMediaPickFromMediaLibrary( [ mediaType ], ( mediaId, mediaUrl ) => {
			if ( mediaId ) {
				this.props.onSelectURL( mediaId, mediaUrl );
			}
		} );
	}

	onMediaUploadButtonPressed() {
		const { mediaType } = this.props;

		requestMediaPickFromDeviceLibrary( [ mediaType ], ( mediaId, mediaUrl ) => {
			if ( mediaId ) {
				this.props.onSelectURL( mediaId, mediaUrl );
			}
		} );
	}

	onMediaCaptureButtonPressed() {
		const { mediaType } = this.props;

		requestMediaPickFromDeviceCamera( [ mediaType ], ( mediaId, mediaUrl ) => {
			if ( mediaId ) {
				this.props.onSelectURL( mediaId, mediaUrl );
			}
		} );
	}

	render() {
		const { isOpen, onClose } = this.props;
		const mediaOptions = this.getMediaOptionsItems();

		return (
			<Picker
				isOpen={ isOpen }
				hideCancelButton={ true }
				options={ mediaOptions }
				onChange={ ( value ) => {
					if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE ) {
						this.onMediaUploadButtonPressed();
					} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA ) {
						this.onMediaCaptureButtonPressed();
					} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY ) {
						this.onMediaLibraryButtonPressed();
					}
				} }
				onClose={ onClose }
			/>
		);
	}
}

MediaPicker.MEDIA_TYPE_IMAGE = MEDIA_TYPE_IMAGE;
MediaPicker.MEDIA_TYPE_VIDEO = MEDIA_TYPE_VIDEO;

MediaPicker.MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE = MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE;
MediaPicker.MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA = MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA;
MediaPicker.MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY = MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY;

MediaPicker.OPTION_TAKE_VIDEO = OPTION_TAKE_VIDEO;
MediaPicker.OPTION_TAKE_PHOTO = OPTION_TAKE_PHOTO;

export default MediaPicker;
