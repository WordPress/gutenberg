/**
 * External dependencies
 */
import React from 'react';
import { View, TextInput, TouchableWithoutFeedback, Text } from 'react-native';
/**
 * Internal dependencies
 */
import Video from './video-player';
import {
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import {
	Icon,
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
import MediaUploadProgress from '../image/media-upload-progress';
import style from './style.scss';
import SvgIcon from './icon';
import SvgIconRetry from './icon-retry';

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
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.onVideoPressed = this.onVideoPressed.bind( this );
		this.onVideoContanerLayout = this.onVideoContanerLayout.bind( this );
	}

	componentDidMount() {
		const { attributes } = this.props;
		if ( attributes.id && attributes.url && ! isURL( attributes.src ) ) {
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		// this action will only exist if the user pressed the trash button on the block holder
		if ( hasAction( 'blocks.onRemoveBlockCheckUpload' ) && this.state.isUploadInProgress ) {
			doAction( 'blocks.onRemoveBlockCheckUpload', this.props.attributes.id );
		}
	}

	onVideoPressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if ( attributes.id && ! isURL( attributes.src ) ) {
			requestImageFailedRetryDialog( attributes.id );
		}
	}

	updateMediaProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}

		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId } );
		this.setState( { isMediaRequested: false, isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId } );
		this.setState( { isMediaRequested: false, isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;
		setAttributes( { id: null, src: null } );
		this.setState( { isMediaRequested: false, isUploadInProgress: false } );
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

	getIcon( isRetryIcon, isUploadInProgress ) {
		if ( isRetryIcon ) {
			return <Icon icon={ SvgIconRetry } style={ style.icon } />;
		}

		return <Icon icon={ SvgIcon } style={ isUploadInProgress ? style.iconUploading : style.icon } />;
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { caption, id, src } = attributes;
		const { isMediaRequested, videoContainerHeight } = this.state;

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
						icon={ this.getIcon( false ) }
						onFocus={ this.props.onFocus }
					/>
				</View>
			);
		}

		return (
			<TouchableWithoutFeedback onPress={ this.onVideoPressed } disabled={ ! isSelected }>
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
						onUpdateMediaProgress={ this.updateMediaProgress }
						onMediaUploadStateReset={ this.mediaUploadStateReset }
						renderContent={ ( { isUploadInProgress, isUploadFailed, retryMessage } ) => {
							const showVideo = src && ! isUploadInProgress && ! isUploadFailed;
							const icon = this.getIcon( isUploadFailed, isUploadInProgress );
							const styleIconContainer = isUploadFailed ? style.modalIconRetry : style.modalIcon;

							const iconContainer = (
								<View style={ styleIconContainer }>
									{ icon }
								</View>
							);

							const videoStyle = {
								height: videoContainerHeight,
								...style.video,
							};

							const containerStyle = showVideo && isSelected ? style.containerFocused : style.container;

							return (
								<View onLayout={ this.onVideoContanerLayout } style={ containerStyle }>
									{ showVideo && isURL( src ) &&
										<Video
											isSelected={ isSelected }
											style={ [ videoStyle, { backgroundColor: 'black' } ] }
											source={ { uri: src } }
											paused={ true }
											muted={ true }
										/>
									}
									{ ! showVideo &&
										<View style={ { ...videoStyle, ...style.placeholder } }>
											{ videoContainerHeight > 0 && iconContainer }
											{ isUploadFailed && <Text style={ style.uploadFailedText }>{ retryMessage }</Text> }
										</View>
									}
								</View>
							);
						} }
					/>
					{ ( ! RichText.isEmpty( caption ) > 0 || isSelected ) && (
						<View style={ { paddingTop: 8, paddingBottom: 0, flex: 1 } }>
							<TextInput
								style={ { textAlign: 'center' } }
								fontFamily={ this.props.fontFamily || ( style[ 'caption-text' ].fontFamily ) }
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
