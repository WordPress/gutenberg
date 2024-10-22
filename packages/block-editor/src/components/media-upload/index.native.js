/**
 * External dependencies
 */
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, React } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	BottomSheet,
	PanelBody,
	Picker,
	TextControl,
} from '@wordpress/components';
import {
	getOtherMediaOptions,
	requestMediaPicker,
	mediaSources,
} from '@wordpress/react-native-bridge';
import {
	capturePhoto,
	captureVideo,
	image,
	wordpress,
	mobile,
	globe,
} from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	MEDIA_TYPE_AUDIO,
	MEDIA_TYPE_ANY,
	OPTION_TAKE_VIDEO,
	OPTION_TAKE_PHOTO,
	OPTION_INSERT_FROM_URL,
	OPTION_WORDPRESS_MEDIA_LIBRARY,
} from './constants';
import styles from './style.scss';

const URL_MEDIA_SOURCE = 'URL';

const PICKER_OPENING_DELAY = 200;

export class MediaUpload extends Component {
	pickerTimeout;

	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
		this.onPickerSelect = this.onPickerSelect.bind( this );
		this.getAllSources = this.getAllSources.bind( this );
		this.state = {
			url: '',
			showURLInput: false,
			otherMediaOptions: [],
		};
	}

	componentDidMount() {
		const { allowedTypes = [], autoOpen } = this.props;
		getOtherMediaOptions( allowedTypes, ( otherMediaOptions ) => {
			const otherMediaOptionsWithIcons = otherMediaOptions.map(
				( option ) => {
					return {
						...option,
						requiresModal: true,
						types: allowedTypes,
						id: option.value,
					};
				}
			);

			this.setState( { otherMediaOptions: otherMediaOptionsWithIcons } );
		} );

		if ( autoOpen ) {
			this.onPickerPresent();
		}
	}

	componentWillUnmount() {
		clearTimeout( this.pickerTimeout );
	}

	getAllSources() {
		const { onSelectURL } = this.props;

		const cameraImageSource = {
			id: mediaSources.deviceCamera, // ID is the value sent to native.
			value: mediaSources.deviceCamera + '-IMAGE', // This is needed to diferenciate image-camera from video-camera sources.
			label: OPTION_TAKE_PHOTO,
			requiresModal: true,
			types: [ MEDIA_TYPE_IMAGE ],
			icon: capturePhoto,
		};

		const cameraVideoSource = {
			id: mediaSources.deviceCamera,
			value: mediaSources.deviceCamera,
			label: OPTION_TAKE_VIDEO,
			requiresModal: true,
			types: [ MEDIA_TYPE_VIDEO ],
			icon: captureVideo,
		};

		const deviceLibrarySource = {
			id: mediaSources.deviceLibrary,
			value: mediaSources.deviceLibrary,
			label: __( 'Choose from device' ),
			requiresModal: true,
			types: [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ],
			icon: image,
		};

		const siteLibrarySource = {
			id: mediaSources.siteMediaLibrary,
			value: mediaSources.siteMediaLibrary,
			label: OPTION_WORDPRESS_MEDIA_LIBRARY,
			requiresModal: true,
			types: [
				MEDIA_TYPE_IMAGE,
				MEDIA_TYPE_VIDEO,
				MEDIA_TYPE_AUDIO,
				MEDIA_TYPE_ANY,
			],
			icon: wordpress,
			mediaLibrary: true,
		};

		const urlSource = {
			id: URL_MEDIA_SOURCE,
			value: URL_MEDIA_SOURCE,
			label: OPTION_INSERT_FROM_URL,
			types: [ MEDIA_TYPE_AUDIO, MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ],
			icon: globe,
		};

		// Only include `urlSource` option if `onSelectURL` prop is present, in order to match the web behavior.
		const internalSources = [
			deviceLibrarySource,
			cameraImageSource,
			cameraVideoSource,
			siteLibrarySource,
			...( onSelectURL ? [ urlSource ] : [] ),
		];

		return internalSources.concat( this.state.otherMediaOptions );
	}

	getMediaOptionsItems() {
		const {
			allowedTypes = [],
			__experimentalOnlyMediaLibrary,
			isAudioBlockMediaUploadEnabled,
		} = this.props;

		return this.getAllSources()
			.filter( ( source ) => {
				if ( __experimentalOnlyMediaLibrary ) {
					return source.mediaLibrary;
				} else if (
					allowedTypes.every(
						( allowedType ) =>
							allowedType === MEDIA_TYPE_AUDIO &&
							source.types.includes( allowedType )
					) &&
					source.id !== URL_MEDIA_SOURCE
				) {
					return isAudioBlockMediaUploadEnabled === true;
				}

				return allowedTypes.some( ( allowedType ) =>
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
		return mobile;
	}

	onPickerPresent() {
		const { autoOpen } = this.props;
		const isIOS = Platform.OS === 'ios';

		if ( this.picker ) {
			// the delay below is required because on iOS this action sheet gets dismissed by the close event of the Inserter
			// so this delay allows the Inserter to be closed fully before presenting action sheet.
			if ( autoOpen && isIOS ) {
				this.pickerTimeout = setTimeout(
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

		if ( value === URL_MEDIA_SOURCE ) {
			this.setState( { showURLInput: true } );
			return;
		}

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
		const { allowedTypes = [], isReplacingMedia, multiple } = this.props;
		const isOneType = allowedTypes.length === 1;
		const isImage = isOneType && allowedTypes.includes( MEDIA_TYPE_IMAGE );
		const isVideo = isOneType && allowedTypes.includes( MEDIA_TYPE_VIDEO );
		const isAudio = isOneType && allowedTypes.includes( MEDIA_TYPE_AUDIO );
		const isAnyType = isOneType && allowedTypes.includes( MEDIA_TYPE_ANY );

		const isImageOrVideo =
			allowedTypes.length === 2 &&
			allowedTypes.includes( MEDIA_TYPE_IMAGE ) &&
			allowedTypes.includes( MEDIA_TYPE_VIDEO );

		let pickerTitle;
		if ( isImage ) {
			if ( isReplacingMedia ) {
				pickerTitle = __( 'Replace image' );
			} else {
				pickerTitle = multiple
					? __( 'Choose images' )
					: __( 'Choose image' );
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
		} else if ( isAudio ) {
			if ( isReplacingMedia ) {
				pickerTitle = __( 'Replace audio' );
			} else {
				pickerTitle = __( 'Choose audio' );
			}
		} else if ( isAnyType ) {
			pickerTitle = __( 'Choose file' );
			if ( isReplacingMedia ) {
				pickerTitle = __( 'Replace file' );
			} else {
				pickerTitle = __( 'Choose file' );
			}
		}

		const getMediaOptions = () => (
			<Picker
				title={ pickerTitle }
				hideCancelButton
				ref={ ( instance ) => ( this.picker = instance ) }
				options={ this.getMediaOptionsItems() }
				onChange={ this.onPickerSelect }
				testID="media-options-picker"
			/>
		);

		return (
			<>
				<URLInput
					isVisible={ this.state.showURLInput }
					onClose={ () => {
						if ( this.state.url !== '' ) {
							this.props.onSelectURL( this.state.url );
						}
						this.setState( { showURLInput: false, url: '' } );
					} }
					onChange={ ( url ) => {
						this.setState( { url } );
					} }
					value={ this.state.url }
				/>
				{ this.props.render( {
					open: this.onPickerPresent,
					getMediaOptions,
				} ) }
			</>
		);
	}
}

function URLInput( props ) {
	return (
		<BottomSheet
			hideHeader
			isVisible={ props.isVisible }
			onClose={ props.onClose }
		>
			<PanelBody style={ styles[ 'media-upload__link-input' ] }>
				<TextControl
					// TODO: Switch to `true` (40px size) if possible
					__next40pxDefaultSize={ false }
					// eslint-disable-next-line jsx-a11y/no-autofocus
					autoFocus
					autoCapitalize="none"
					autoCorrect={ false }
					autoComplete={ Platform.isIOS ? 'url' : 'off' }
					keyboardType="url"
					label={ OPTION_INSERT_FROM_URL }
					onChange={ props.onChange }
					placeholder={ __( 'Type a URL' ) }
					value={ props.value }
				/>
			</PanelBody>
		</BottomSheet>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { capabilities } = select( blockEditorStore ).getSettings();
		return {
			isAudioBlockMediaUploadEnabled:
				capabilities?.isAudioBlockMediaUploadEnabled === true,
		};
	} ),
] )( MediaUpload );
