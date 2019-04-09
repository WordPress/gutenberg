/**
 * External dependencies
 */
import React from 'react';
import { View, TextInput, TouchableWithoutFeedback } from 'react-native';
import Video from 'react-native-video';
import {
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
} from '@wordpress/components';
import {
	MediaPlaceholder,
	MediaUpload,
	MEDIA_TYPE_VIDEO,
	RichText,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import styles from '../image/styles.scss';
import MediaUploadUI from '../image/media-upload-ui.native.js';

class VideoEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			showSettings: false,
			thumbnailUrl: null,
		};

		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
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
		if ( payload.mediaUrl ) {
			this.setState( { thumbnailUrl: payload.mediaUrl } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId } );
	}

	mediaUploadStateReset( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId, src: null } );
		this.setState( { thumbnailUrl: null } );
	}

	updateImageURL( url ) {
		this.props.setAttributes( { url, width: undefined, height: undefined } );
	}

	onSelectMediaUploadOption( mediaId, mediaUrl, thumbnailUrl ) {
		const { setAttributes } = this.props;
		setAttributes( { id: mediaId, src: mediaUrl } );
		this.setState( { thumbnailUrl: thumbnailUrl } );
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { caption, height, width, id, poster, src } = attributes;
		const { thumbnailUrl } = this.state;
		//const url = src ? src : thumbnailUrl;
		const activePoster = poster ? poster : thumbnailUrl;

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

		if ( ! activePoster && ! src ) {
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
						//height={ height }
						//width={ width }
						//coverUrl={ url }
						mediaId={ id }
						onUpdateMediaProgress={ this.updateMediaProgress }
						onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
						onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
						onMediaUploadStateReset={ this.mediaUploadStateReset }
						renderContent={ ( isUploadInProgress ) => {
							// Later on in your styles..
							var videoStyle = {
								backgroundVideo: {
									height: 200,
									width: 300,
								},
							};

							return (
								
								<View style={ { flex: 1, justifyContent: 'center', alignItems: 'center' } }>
									{ src && 
										<Video
											source={ { uri: src } }
											poster={ activePoster }
											style={ videoStyle.backgroundVideo }
											controls={ true }
										/>}
							
								</View>

							);
						}}
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
