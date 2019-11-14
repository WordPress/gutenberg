/**
 * External dependencies
 */
import React from 'react';
import {
	getOtherMediaOptions,
	requestMediaPicker,
	mediaSources,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';

export const OPTION_TAKE_VIDEO = __( 'Take a Video' );
export const OPTION_TAKE_PHOTO = __( 'Take a Photo' );
export const OPTION_TAKE_PHOTO_OR_VIDEO = __( 'Take a Photo or Video' );

const cameraImageSource = {
	value: mediaSource.device,
	label: __( 'Take a Photo' ),
	types: [MEDIA_TYPE_IMAGE],
	icon: 'camera',
};

const cameraVideoSource = {
	value: mediaSource.device,
	label: __( 'Take a Video' ),
	type: [MEDIA_TYPE_VIDEO],
	icon: 'camera',
};

const deviceLibrarySource = {
	value: mediaSource.device,
	label: __( 'Choose from device' ),
	type: [MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO],
};

const siteLibrarySource = {
	value: mediaSource.device,
	label: __( 'WordPress Media Library' ),
	type: [MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO],
	icon: 'wordpress-alt',
};

const localSources = [cameraImageSource, cameraVideoSource, deviceLibrarySource, siteLibrarySource];

export class MediaUpload extends React.Component {
	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
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
		return allowedTypes.filter( ( allowedType ) => {
			return localSources.filter( (source) => source.types.includes( allowedType ) );
		} ).map( ( source ) => {
			return {
				...source,
				icon: source.icon || this.getTakeMediaIcon(),
			};
		} );
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

	onPickerSelect( source ) {
		const { allowedTypes = [], onSelect, multiple = false } = this.props;
		requestMediaPicker( source, allowedTypes, multiple, ( media ) => {
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
				onChange={ this.onPickerSelect }
			/>
		);

		return this.props.render( { open: this.onPickerPresent, getMediaOptions } );
	}
}

export default MediaUpload;
