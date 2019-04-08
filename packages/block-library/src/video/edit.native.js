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
	MediaUpload,
	MEDIA_TYPE_VIDEO,
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

class VideoEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			showSettings: false,
			thumbnailUrl: props.poster,
		};

		this.mediaUploadStateReset = this.mediaUploadStateReset( this );
		this.onSelectMediaUploadOption = this.onSelectMediaUploadOption.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
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
		} else {
			//Ask for playback options
		}
	}

	updateMediaProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			this.setState( { thumbnailUrl: payload.mediaUrl });
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

	updateImageURL( url ) {
		this.props.setAttributes( { url, width: undefined, height: undefined } );
	}

	onSelectMediaUploadOption( mediaId: number, mediaUrl: string ) {
		const { setAttributes } = this.props;
		setAttributes( { id: mediaId } );
		this.setState( { thumbnailUrl: mediaUrl } );
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { caption, height, width, alt, href, id, poster } = attributes;
		const { thumbnailUrl } = this.state;
		const url = poster ? poster : thumbnailUrl;

		const onImageSettingsButtonPressed = () => {
			this.setState( { showSettings: true } );
		};

		const onImageSettingsClose = () => {
			this.setState( { showSettings: false } );
		};

		const toolbarEditButton = (
			<MediaUpload mediaType={ MEDIA_TYPE_VIDEO }
						onSelectURL={ this.onSelectMediaUploadOption }
						render={ ( { open, getMediaOptions } ) => {
							return (
							<Toolbar>
								{ getMediaOptions() }
								<ToolbarButton
									label={ __( 'Edit video' ) }
									icon="edit"
									onClick={ open }
								/>
							</Toolbar>
							);
						} } >
			</MediaUpload>
		);

		if ( ! url ) {
			return (
				<View style={ { flex: 1 } } >
					<MediaPlaceholder
						mediaType={ MEDIA_TYPE_VIDEO }
						onSelectURL={ this.onSelectMediaUploadOption }
					/>
				</View>
			);
		}

		return (
			<TouchableWithoutFeedback onPress={ this.onImagePressed } disabled={ ! isSelected }>
				<View style={ { flex: 1 } }>
					<BlockControls>
						{ toolbarEditButton }
					</BlockControls>
					<InspectorControls>
						<ToolbarButton
							label={ __( 'Video Settings' ) }
							icon="admin-generic"
							onClick={ () => ( null ) }
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
