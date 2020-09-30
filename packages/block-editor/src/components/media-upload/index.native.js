/**
 * External dependencies
 */
import React from 'react';
import { Platform } from 'react-native';

import { delay } from 'lodash';

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
import {
	capturePhoto,
	captureVideo,
	image,
	video,
	wordpress,
} from '@wordpress/icons';

export const MEDIA_TYPE_IMAGE = 'image';
export const MEDIA_TYPE_VIDEO = 'video';
export const MEDIA_UPLOAD_CANCEL = `cancel_media_upload`;

export const OPTION_TAKE_VIDEO = __( 'Take a Video' );
export const OPTION_TAKE_PHOTO = __( 'Take a Photo' );
export const OPTION_TAKE_PHOTO_OR_VIDEO = __( 'Take a Photo or Video' );

const PICKER_OPENING_DELAY = 200;

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
		const { allowedTypes = [], autoOpenMediaUpload } = this.props;
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

		if ( autoOpenMediaUpload ) {
			this.onPickerPresent();
		}
	}

	getAllSources() {
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
			return image;
		} else if ( isVideo ) {
			return video;
		}
	}

	onPickerPresent() {
		const { autoOpenMediaUpload } = this.props;
		const isIOS = Platform.OS === 'ios';

		if ( this.picker ) {
			if ( autoOpenMediaUpload && isIOS ) {
				delay(
					() => this.picker.presentPicker(),
					PICKER_OPENING_DELAY
				);
			} else {
				this.picker.presentPicker();
			}
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
		const { allowedTypes = [], isReplacingMedia } = this.props;
		const isOneType = allowedTypes.length === 1;
		const isImage = isOneType && allowedTypes.includes( MEDIA_TYPE_IMAGE );
		const isVideo = isOneType && allowedTypes.includes( MEDIA_TYPE_VIDEO );
		const isImageOrVideo =
			allowedTypes.length === 2 &&
			allowedTypes.includes( MEDIA_TYPE_IMAGE ) &&
			allowedTypes.includes( MEDIA_TYPE_VIDEO );

		let pickerTitle;
		if ( isImage ) {
			if ( isReplacingMedia ) {
				pickerTitle = __( 'Replace image' );
			} else {
				pickerTitle = __( 'Choose image' );
			}
		} else if ( isVideo ) {
			if ( isReplacingMedia ) {
				pickerTitle = __( 'Replace video' );
			} else {
				pickerTitle = __( 'Choose video' );
			}
		} else if ( isImageOrVideo ) {
			if ( isReplacingMedia ) {
				pickerTitle = __( 'Replace image or video' );
			} else {
				pickerTitle = __( 'Choose image or video' );
			}
		}

		const getMediaOptions = () => (
			<Picker
				title={ pickerTitle }
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
