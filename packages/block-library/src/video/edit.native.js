/**
 * External dependencies
 */
import React from 'react';
import { View, ImageBackground, TextInput, Text, TouchableWithoutFeedback } from 'react-native';
import {
	subscribeMediaUpload,
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	requestMediaImport,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import {
	Toolbar,
	ToolbarButton,
	Spinner,
	Dashicon,
} from '@wordpress/components';
import {
	MediaPlaceholder,
	RichText,
	BlockControls,
	InspectorControls,
	BottomSheet,
	Picker,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import ImageSize from '../image/image-size';
import styles from '../image/styles.scss';
import MediaUploadUI from '../image/media-upload-ui.native.js';

const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE = 'choose_from_device';
const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_PHOTO = 'take_photo';
const MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY = 'wordpress_media_library';

const LINK_DESTINATION_CUSTOM = 'custom';
const LINK_DESTINATION_NONE = 'none';
const MEDIA_TYPE = "video";

class VideoEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			showSettings: false,
			thumbnailUrl: props.poster,
		};

		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
		this.onClearSettings = this.onClearSettings.bind( this );
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;

		if ( attributes.id && ! isURL( attributes.url ) ) {
			if ( attributes.url && attributes.url.indexOf( 'file:' ) === 0 ) {
				requestMediaImport( attributes.url, ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			}
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		// this action will only exist if the user pressed the trash button on the block holder
		if ( hasAction( 'blocks.onRemoveBlockCheckUpload' ) && this.state.isUploadInProgress ) {
			doAction( 'blocks.onRemoveBlockCheckUpload', this.props.attributes.id );
		}
	}

	onImagePressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if ( attributes.id && ! isURL( attributes.url ) ) {
			requestImageFailedRetryDialog( attributes.id );
		}
	}

	updateMediaProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			this.setState( { thumbnailUrl: payload.mediaUrl });
			//setAttributes( { url: payload.mediaUrl } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId, poster: this.state.thumbnailUrl  } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { id: payload.mediaId } );
	}

	mediaUploadStateReset( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { id: payload.mediaId, thumbnailUrl: null } );
	}

	updateAlt( newAlt ) {
		this.props.setAttributes( { alt: newAlt } );
	}

	updateImageURL( url ) {
		this.props.setAttributes( { url, width: undefined, height: undefined } );
	}

	onSetLinkDestination( href ) {
		this.props.setAttributes( {
			linkDestination: LINK_DESTINATION_CUSTOM,
			href,
		} );
	}

	onClearSettings() {
		this.props.setAttributes( {
			alt: '',
			linkDestination: LINK_DESTINATION_NONE,
			href: undefined,
		} );
	}

	getMediaOptionsItems() {
		return [
			{ icon: 'format-image', value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE, label: __( 'Choose from device' ) },
			{ icon: 'camera', value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_PHOTO, label: __( 'Take a Photo' ) },
			{ icon: 'wordpress-alt', value: MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY, label: __( 'WordPress Media Library' ) },
		];
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { caption, height, width, alt, href, id, poster } = attributes;
		const { thumbnailUrl } = this.state;
		const url = poster ? poster : thumbnailUrl;

		const onMediaLibraryButtonPressed = () => {
			requestMediaPickFromMediaLibrary( [ MEDIA_TYPE ], ( mediaId, mediaUrl ) => {
				if ( mediaUrl ) {
					setAttributes( { id: mediaId /*, url: mediaUrl*/ } );
					this.setState( { thumbnailUrl: mediaUrl } );
				}
			} );
		};

		const onMediaUploadButtonPressed = () => {
			requestMediaPickFromDeviceLibrary( [ MEDIA_TYPE ], ( mediaId, mediaUri ) => {
				if ( mediaUri ) {
					setAttributes( { /* url: mediaUri,*/ id: mediaId } );
					this.setState( { thumbnailUrl: mediaUri } );
				}
			} );
		};

		const onMediaCaptureButtonPressed = () => {
			requestMediaPickFromDeviceCamera( ( mediaId/*, mediaUri */) => {
				if ( mediaUri ) {
					setAttributes( { /*url: mediaUri,*/ id: mediaId } );
					this.setState( { thumbnailUrl: mediaUri } );
				}
			} );
		};

		const onImageSettingsButtonPressed = () => {
			this.setState( { showSettings: true } );
		};

		const onImageSettingsClose = () => {
			this.setState( { showSettings: false } );
		};

		let picker;

		const onMediaOptionsButtonPressed = () => {
			picker.presentPicker();
		};

		const toolbarEditButton = (
			<Toolbar>
				<ToolbarButton
					label={ __( 'Edit image' ) }
					icon="edit"
					onClick={ onMediaOptionsButtonPressed }
				/>
			</Toolbar>
		);

		const getInspectorControls = () => (
			<BottomSheet
				isVisible={ this.state.showSettings }
				onClose={ onImageSettingsClose }
				hideHeader
			>
				<BottomSheet.Cell
					icon={ 'admin-links' }
					label={ __( 'Link To' ) }
					value={ href || '' }
					valuePlaceholder={ __( 'Add URL' ) }
					onChangeValue={ this.onSetLinkDestination }
					autoCapitalize="none"
					autoCorrect={ false }
				/>
				<BottomSheet.Cell
					icon={ 'editor-textcolor' }
					label={ __( 'Alt Text' ) }
					value={ alt || '' }
					valuePlaceholder={ __( 'None' ) }
					separatorType={ 'fullWidth' }
					onChangeValue={ this.updateAlt }
				/>
				<BottomSheet.Cell
					label={ __( 'Clear All Settings' ) }
					labelStyle={ styles.clearSettingsButton }
					separatorType={ 'none' }
					onPress={ this.onClearSettings }
				/>
			</BottomSheet>
		);

		const mediaOptions = this.getMediaOptionsItems();

		const getMediaOptions = () => (
			<Picker
				hideCancelButton={ true }
				ref={ ( instance ) => picker = instance }
				options={ mediaOptions }
				onChange={ ( value ) => {
					if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_CHOOSE_FROM_DEVICE ) {
						onMediaUploadButtonPressed();
					} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_TAKE_PHOTO ) {
						onMediaCaptureButtonPressed();
					} else if ( value === MEDIA_UPLOAD_BOTTOM_SHEET_VALUE_WORD_PRESS_LIBRARY ) {
						onMediaLibraryButtonPressed();
					}
				} }
			/>
		);

		if ( ! url ) {
			return (
				<View style={ { flex: 1 } } >
				 	{ getMediaOptions() }
				 	<MediaPlaceholder
				 		onMediaOptionsPressed={ onMediaOptionsButtonPressed }
				 	/>
				</View>
			);
		}

		return (
			<TouchableWithoutFeedback onPress={ this.onImagePressed } disabled={ ! isSelected }>
				<View style={ { flex: 1 } }>
					{ getInspectorControls() }
					{ getMediaOptions() }
					<BlockControls>
						{ toolbarEditButton }
					</BlockControls>
					<InspectorControls>
						<ToolbarButton
							label={ __( 'Image Settings' ) }
							icon="admin-generic"
							onClick={ onImageSettingsButtonPressed }
						/>
					</InspectorControls>
					<MediaUploadUI 
						height={ height }
						width={ width }
						coverUrl={ url }
						mediaId={ id }
						onUpdateMediaProgress={ this.updateMediaProgress }
						onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
						onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
						onmediaUploadStateReset={ this.mediaUploadStateReset }
					/>
					{ ( ! RichText.isEmpty( caption ) > 0 || isSelected ) && (
						<View style={ { padding: 12, flex: 1 } }>
							<TextInput
								style={ { textAlign: 'center' } }
								fontFamily={ this.props.fontFamily || ( styles[ 'caption-text' ].fontFamily ) }
								underlineColorAndroid="transparent"
								value={ caption }
								placeholder={ __( 'Write caption…' ) }
								onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
							/>
						</View>
					) }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default VideoEdit;
