/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';
import {
	getOtherMediaOptions,
	requestMediaPicker,
	mediaSources,
} from '@wordpress/react-native-bridge';
import { capturePhoto, captureVideo, image, wordpress } from '@wordpress/icons';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';

export const OPTION_TAKE_VIDEO = __( 'Take a Video' );
export const OPTION_TAKE_PHOTO = __( 'Take a Photo' );
export const OPTION_TAKE_PHOTO_OR_VIDEO = __( 'Take a Photo or Video' );

const cameraImageSource = {
	id: mediaSources.deviceCamera, // ID is the value sent to native
	value: mediaSources.deviceCamera + '-IMAGE', // This is needed to diferenciate image-camera from video-camera sources.
	label: __( 'Take a Photo' ),
	types: [ MEDIA_TYPE_IMAGE ],
	icon: capturePhoto,
};

const cameraVideoSource = {
	id: mediaSources.deviceCamera,
	value: mediaSources.deviceCamera,
	label: __( 'Take a Video' ),
	types: [ MEDIA_TYPE_VIDEO ],
	icon: captureVideo,
};

const deviceLibrarySource = {
	id: mediaSources.deviceLibrary,
	value: mediaSources.deviceLibrary,
	label: __( 'Choose from device' ),
	types: [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ],
	icon: image,
};

const siteLibrarySource = {
	id: mediaSources.siteMediaLibrary,
	value: mediaSources.siteMediaLibrary,
	label: __( 'WordPress Media Library' ),
	types: [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ],
	icon: wordpress,
	mediaLibrary: true,
};

const internalSources = [
	deviceLibrarySource,
	cameraImageSource,
	cameraVideoSource,
	siteLibrarySource,
];

export class MediaUpload extends React.Component {
	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
		this.onPickerSelect = this.onPickerSelect.bind( this );
		this.getAllSources = this.getAllSources.bind( this );

		this.state = {
			otherMediaOptions: [],
		};
	}

	componentDidMount() {
		const { allowedTypes = [] } = this.props;
		getOtherMediaOptions( allowedTypes, ( otherMediaOptions ) => {
			const otherMediaOptionsWithIcons = otherMediaOptions.map(
				( option ) => {
					return {
						...option,
						types: allowedTypes,
						id: option.value,
					};
				}
			);

			this.setState( { otherMediaOptions: otherMediaOptionsWithIcons } );
		} );
	}

	getAllSources() {
		return internalSources.concat( this.state.otherMediaOptions );
	}

	getMediaOptionsItems() {
		const {
			allowedTypes = [],
			__experimentalOnlyMediaLibrary,
		} = this.props;

		return this.getAllSources()
			.filter( ( source ) => {
				return __experimentalOnlyMediaLibrary
					? source.mediaLibrary
					: allowedTypes.some( ( allowedType ) =>
							source.types.includes( allowedType )
					  );
			} )
			.map( ( source ) => {
				return {
					...source,
					icon: source.icon || this.getChooseFromDeviceIcon(),
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

	onPickerPresent() {
		if ( this.picker ) {
			this.picker.presentPicker();
		}
	}

	onPickerSelect( value ) {
		const { allowedTypes = [], onSelect, multiple = false } = this.props;
		const mediaSource = this.getAllSources()
			.filter( ( source ) => source.value === value )
			.shift();
		const types = allowedTypes.filter( ( type ) =>
			mediaSource.types.includes( type )
		);

		requestMediaPicker( mediaSource.id, types, multiple, ( media ) => {
			if ( ( multiple && media ) || ( media && media.id ) ) {
				onSelect( media );
			}
		} );
	}

	render() {
		const getMediaOptions = () => (
			<Picker
				hideCancelButton
				ref={ ( instance ) => ( this.picker = instance ) }
				options={ this.getMediaOptionsItems() }
				onChange={ this.onPickerSelect }
			/>
		);

		return this.props.render( {
			open: this.onPickerPresent,
			getMediaOptions,
		} );
	}
}

export default MediaUpload;
