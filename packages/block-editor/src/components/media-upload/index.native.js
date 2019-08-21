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
	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
		this.onPickerChange = this.onPickerChange.bind( this );
		this.onPickerSelect = this.onPickerSelect.bind( this );
	}
	getTakeMediaLabel() {
		const { allowedTypes } = this.props;
		const mediaType = allowedTypes[ 0 ];

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
		const { allowedTypes } = this.props;
		const mediaType = allowedTypes[ 0 ];

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

	onPickerPresent() {
		if ( this.picker ) {
			this.picker.presentPicker();
		}
	}

	onPickerSelect( requestFunction ) {
		const { allowedTypes, onSelect } = this.props;
		requestFunction( allowedTypes, ( mediaId, mediaUrl ) => {
			if ( mediaId ) {
				onSelect( { mediaId, mediaUrl } );
			}
		} );
	}

	onPickerChange( value ) {
		if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE ) {
			this.onPickerSelect( requestMediaPickFromDeviceLibrary );
		} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA ) {
			this.onPickerSelect( requestMediaPickFromDeviceCamera );
		} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY ) {
			this.onPickerSelect( requestMediaPickFromMediaLibrary );
		}
	}

	render() {
		const mediaOptions = this.getMediaOptionsItems();

		const getMediaOptions = () => (
			<Picker
				hideCancelButton={ true }
				ref={ ( instance ) => this.picker = instance }
				options={ mediaOptions }
				onChange={ this.onPickerChange }
			/>
		);

		return this.props.render( { open: this.onPickerPresent, getMediaOptions } );
	}
}

export default MediaUpload;
