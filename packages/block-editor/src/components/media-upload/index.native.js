/**
 * External dependencies
 */
import React from 'react';
import {
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	getOtherMediaOptions,
	requestOtherMediaPickFrom,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';

export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE = 'choose_from_device';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_PHOTO = 'take_photo';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_VIDEO = 'take_video';
export const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY = 'wordpress_media_library';

export const OPTION_TAKE_VIDEO = __( 'Take a Video' );
export const OPTION_TAKE_PHOTO = __( 'Take a Photo' );
export const OPTION_TAKE_PHOTO_OR_VIDEO = __( 'Take a Photo or Video' );

const captureMediaMap = new Map();
captureMediaMap.set( MEDIA_TYPE_IMAGE, MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_PHOTO );
captureMediaMap.set( MEDIA_TYPE_VIDEO, MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_VIDEO );

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

	getTakeMediaLabel( mediaType ) {
		switch ( mediaType ) {
			case MEDIA_TYPE_IMAGE:
				return OPTION_TAKE_PHOTO;
			case MEDIA_TYPE_VIDEO:
				return OPTION_TAKE_VIDEO;
		}

		return OPTION_TAKE_PHOTO;
	}

	getMediaOptionsItems() {
		const { allowedTypes = [] } = this.props;

		// multiple capture options for media text
		const captureMediaOptionsItems = allowedTypes.filter( ( allowedType ) => {
			return allowedType === MEDIA_TYPE_IMAGE || allowedType === MEDIA_TYPE_VIDEO;
		} ).map( ( mediaType ) => {
			return {
				icon: this.getTakeMediaIcon(),
				value: captureMediaMap.get( mediaType ),
				label: this.getTakeMediaLabel( mediaType ),
			};
		} );

		return [
			{ icon: this.getChooseFromDeviceIcon(), value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE, label: __( 'Choose from device' ) },
			...captureMediaOptionsItems,
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

	// request a single image or video from camera
	requestSpecificMediaTypeFromDeviceCamera( mediaType ) {
		const { onSelect } = this.props;

		requestMediaPickFromDeviceCamera( [ mediaType ], false, ( media ) => {
			if ( media && media.id ) {
				onSelect( media );
			}
		} );
	}

	onPickerChange( value ) {
		switch ( value ) {
			case MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE:
				this.onPickerSelect( requestMediaPickFromDeviceLibrary );
				break;
			case MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_PHOTO:
				this.requestSpecificMediaTypeFromDeviceCamera( MEDIA_TYPE_IMAGE );
				break;
			case MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_VIDEO:
				this.requestSpecificMediaTypeFromDeviceCamera( MEDIA_TYPE_VIDEO );
				break;
			case MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY:
				this.onPickerSelect( requestMediaPickFromMediaLibrary );
				break;
			default:
				const { onSelect, multiple = false } = this.props;
				requestOtherMediaPickFrom( value, multiple, ( media ) => {
					if ( ( multiple && media ) || ( media && media.id ) ) {
						onSelect( media );
					}
				} );
				break;
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
