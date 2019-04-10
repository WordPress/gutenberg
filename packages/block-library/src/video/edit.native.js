/**
 * External dependencies
 */
import React from 'react';
import { View, TextInput, TouchableWithoutFeedback } from 'react-native';
/**
 * Internal dependencies
 */
import Video from './video-player';
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
import MediaUploadProgress from '../image/media-upload-progress';
import icon from './icon';

const VIDEO_ASPECT_RATIO = 1.7;

class VideoEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			showSettings: false,
			isMediaRequested: false,
			videoContainerHeight: 0,
		};

		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.onSelectMediaUploadOption = this.onSelectMediaUploadOption.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
		this.onVideoContanerLayout = this.onVideoContanerLayout.bind( this );
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

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId } );
		this.setState( { isMediaRequested: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId } );
		this.setState( { isMediaRequested: false } );
	}

	mediaUploadStateReset( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId, src: null } );
		this.setState( { isMediaRequested: false } );
	}

	onSelectMediaUploadOption( mediaId, mediaUrl ) {
		const { setAttributes } = this.props;
		setAttributes( { id: mediaId, src: mediaUrl } );
		this.setState( { isMediaRequested: true } );
	}

	onVideoContanerLayout( event ) {
		const { width } = event.nativeEvent.layout;
		const height = width / VIDEO_ASPECT_RATIO;
		if ( height !== this.state.videoContainerHeight ) {
			this.setState( { videoContainerHeight: height } );
		}
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { caption, id, poster, src } = attributes;
		const { isMediaRequested } = this.state;

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

		if ( ! isMediaRequested && ! src ) {
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
					<MediaUploadProgress
						mediaId={ id }
						onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
						onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
						onMediaUploadStateReset={ this.mediaUploadStateReset }
						renderContent={ ( isUploadInProgress ) => {
							const opacity = isUploadInProgress ? 0.3 : 1;
							const showVideo = src && ! isUploadInProgress;
							const videoStyle = {
								height: this.state.videoContainerHeight,
								width: '100%',

							};

							return (
								<View onLayout={ this.onVideoContanerLayout } style={ { flex: 1 } }>
									{ showVideo &&
										<Video
											source={ { uri: src } }
											poster={ poster }
											style={ videoStyle }
											paused={ true }
											muted={ true }
										/>
									}
									{ ! showVideo &&
										<View style={ { ...videoStyle, opacity } }>
											{ icon }
										</View>
									}
								</View>
							);
						} }
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
