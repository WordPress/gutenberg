/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import {
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	getOtherMediaOptions,
	requestOtherMediaPickFrom,
} from '@wordpress/react-native-bridge';
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';

export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE = 'choose_from_device';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA = 'take_media';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY = 'wordpress_media_library';

export const OPTION_TAKE_VIDEO = __( 'Take a Video' );
export const OPTION_TAKE_PHOTO = __( 'Take a Photo' );
export const OPTION_TAKE_PHOTO_OR_VIDEO = __( 'Take a Photo or Video' );

export class MediaUpload extends React.Component {
	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
		this.onPickerChange = this.onPickerChange.bind( this );
		this.onPickerSelect = this.onPickerSelect.bind( this );

		this.state = {
			otherMediaOptions: undefined,
		};
	}

	componentDidMount() {
		const { allowedTypes = [] } = this.props;
		getOtherMediaOptions( allowedTypes, ( otherMediaOptions ) => {
			const otherMediaOptionsWithIcons = otherMediaOptions.map( ( option ) => {
				return {
					icon: this.getChooseFromDeviceIcon(),
					value: option.value,
					label: option.label,
				};
			} );

			this.setState( { otherMediaOptions: otherMediaOptionsWithIcons } );
		} );
	}

	getTakeMediaLabel() {
		const { allowedTypes = [] } = this.props;

		const isOneType = allowedTypes.length === 1;
		const isImage = isOneType && allowedTypes.includes( MEDIA_TYPE_IMAGE );
		const isVideo = isOneType && allowedTypes.includes( MEDIA_TYPE_VIDEO );

		if ( isImage ) {
			return OPTION_TAKE_PHOTO;
		} else if ( isVideo ) {
			return OPTION_TAKE_VIDEO;
		} return OPTION_TAKE_PHOTO_OR_VIDEO;
	}

	getMediaOptionsItems() {
		return [
			{ icon: this.getChooseFromDeviceIcon(), value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE, label: __( 'Choose from device' ) },
			{ icon: this.getTakeMediaIcon(), value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_MEDIA, label: this.getTakeMediaLabel() },
			{ icon: this.getWordPressLibraryIcon(), value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY, label: __( 'WordPress Media Library' ) },
		];
	}

	getChooseFromDeviceIcon() {
		const { allowedTypes = [] } = this.props;

		const isOneType = allowedTypes.length === 1;
		const isImage = isOneType && allowedTypes.includes( MEDIA_TYPE_IMAGE );
		const isVideo = isOneType && allowedTypes.includes( MEDIA_TYPE_VIDEO );

		if ( isImage || ! isOneType ) {
			return 'format-image';
		} else if ( isVideo ) {
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
		const { allowedTypes = [], onSelect, multiple = false } = this.props;
		requestFunction( allowedTypes, multiple, ( media ) => {
			if ( ( multiple && media ) || ( media && media.id ) ) {
				onSelect( media );
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
		} else {
			const { onSelect, multiple = false } = this.props;
			requestOtherMediaPickFrom( value, multiple, ( media ) => {
				if ( ( multiple && media ) || ( media && media.id ) ) {
					onSelect( media );
				}
			} );
		}
	}

	render() {
		let mediaOptions = this.getMediaOptionsItems();

		if ( this.state.otherMediaOptions ) {
			mediaOptions = [ ...mediaOptions, ...this.state.otherMediaOptions ];
		}

		const getMediaOptions = () => (
			<Picker
				hideCancelButton
				ref={ ( instance ) => this.picker = instance }
				options={ mediaOptions }
				onChange={ this.onPickerChange }
			/>
		);

		return this.props.render( { open: this.onPickerPresent, getMediaOptions } );
	}
}

export default MediaUpload;
