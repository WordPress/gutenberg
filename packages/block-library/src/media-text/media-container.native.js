/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import {
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	requestImageFullscreenPreview,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Icon, Image, withNotices } from '@wordpress/components';
import {
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	VIDEO_ASPECT_RATIO,
	VideoPlayer,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isURL, getProtocol } from '@wordpress/url';
import { compose, withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import icon from './media-container-icon';
import SvgIconRetry from './icon-retry';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ];

export { imageFillStyles } from './media-container.js';

class MediaContainer extends Component {
	constructor() {
		super( ...arguments );
		this.onUploadError = this.onUploadError.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind(
			this
		);
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind(
			this
		);
		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.onSelectMediaUploadOption = this.onSelectMediaUploadOption.bind(
			this
		);
		this.onMediaPressed = this.onMediaPressed.bind( this );

		this.state = {
			isUploadInProgress: false,
		};
	}

	componentDidMount() {
		const { mediaId, mediaUrl } = this.props;

		// Make sure we mark any temporary images as failed if they failed while
		// the editor wasn't open
		if ( mediaId && mediaUrl && getProtocol( mediaUrl ) === 'file:' ) {
			mediaUploadSync();
		}
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	onSelectMediaUploadOption( params ) {
		const { id, url, type } = params;
		const { onSelectMedia } = this.props;

		onSelectMedia( {
			media_type: type,
			id,
			url,
		} );
	}

	onMediaPressed() {
		const { isUploadInProgress } = this.state;
		const {
			mediaId,
			mediaUrl,
			mediaType,
			isMediaSelected,
			onMediaSelected,
		} = this.props;

		if ( isUploadInProgress ) {
			requestImageUploadCancelDialog( mediaId );
		} else if ( mediaId && getProtocol( mediaUrl ) === 'file:' ) {
			requestImageFailedRetryDialog( mediaId );
		} else if ( mediaType === MEDIA_TYPE_IMAGE && isMediaSelected ) {
			requestImageFullscreenPreview( mediaUrl );
		} else if ( mediaType === MEDIA_TYPE_IMAGE ) {
			onMediaSelected();
		}
	}

	getIcon( isRetryIcon, isVideo ) {
		if ( isRetryIcon ) {
			return (
				<Icon
					icon={ SvgIconRetry }
					{ ...( styles.iconRetry,
					isVideo ? styles.iconRetryVideo : {} ) }
				/>
			);
		}

		const iconStyle = this.props.getStylesFromColorScheme(
			styles.icon,
			styles.iconDark
		);
		return <Icon icon={ icon } { ...iconStyle } />;
	}

	updateMediaProgress() {
		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { onMediaUpdate } = this.props;

		onMediaUpdate( {
			id: payload.mediaServerId,
			url: payload.mediaUrl,
		} );
		this.setState( { isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure() {
		this.setState( { isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { onMediaUpdate } = this.props;

		onMediaUpdate( { id: null, url: null } );
		this.setState( { isUploadInProgress: false } );
	}

	renderImage( params, openMediaOptions ) {
		const { isUploadInProgress } = this.state;
		const {
			focalPoint,
			mediaAlt,
			mediaUrl,
			isSelected,
			isMediaSelected,
			imageFill,
		} = this.props;
		const { isUploadFailed, retryMessage } = params;
		const focalPointValues =
			imageFill && ! focalPoint ? { x: 0.5, y: 0.5 } : focalPoint;

		return (
			<View
				style={ [
					imageFill && {
						height: styles.imageFill.height,
					},
					imageFill && styles.imageWithFocalPoint,
				] }
			>
				<TouchableWithoutFeedback
					accessible={ ! isSelected }
					onPress={ this.onMediaPressed }
					onLongPress={ openMediaOptions }
					disabled={ ! isSelected }
				>
					<View style={ { flex: 1 } }>
						<Image
							alt={ mediaAlt }
							focalPoint={ imageFill && focalPointValues }
							isSelected={ isMediaSelected && isMediaSelected }
							isUploadFailed={ isUploadFailed }
							isUploadInProgress={ isUploadInProgress }
							onSelectMediaUploadOption={
								this.onSelectMediaUploadOption
							}
							openMediaOptions={ openMediaOptions }
							retryMessage={ retryMessage }
							url={ mediaUrl }
						/>
					</View>
				</TouchableWithoutFeedback>
			</View>
		);
	}

	renderVideo( params, openMediaOptions ) {
		const { mediaUrl, isSelected } = this.props;
		const { isUploadInProgress } = this.state;
		const { isUploadFailed, retryMessage } = params;
		const showVideo =
			isURL( mediaUrl ) && ! isUploadInProgress && ! isUploadFailed;

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				onPress={ this.onMediaPressed }
				onLongPress={ openMediaOptions }
				disabled={ ! isSelected }
			>
				<View aspectRatio={ VIDEO_ASPECT_RATIO }>
					{ showVideo && (
						<View style={ styles.videoContainer }>
							<VideoPlayer
								isSelected={ isSelected }
								style={ styles.video }
								source={ { uri: mediaUrl } }
								paused={ true }
							/>
						</View>
					) }
					{ ! showVideo && (
						<View style={ styles.videoPlaceholder }>
							<View style={ styles.modalIcon }>
								{ isUploadFailed
									? this.getIcon( isUploadFailed )
									: this.getIcon( false ) }
							</View>
							{ isUploadFailed && (
								<Text
									style={ [
										styles.uploadFailedText,
										styles.uploadFailedTextVideo,
									] }
								>
									{ retryMessage }
								</Text>
							) }
						</View>
					) }
				</View>
			</TouchableWithoutFeedback>
		);
	}

	renderContent( params, openMediaOptions ) {
		const { mediaType } = this.props;
		let mediaElement = null;

		switch ( mediaType ) {
			case MEDIA_TYPE_IMAGE:
				mediaElement = this.renderImage( params, openMediaOptions );
				break;
			case MEDIA_TYPE_VIDEO:
				mediaElement = this.renderVideo( params, openMediaOptions );
				break;
		}
		return mediaElement;
	}

	renderPlaceholder() {
		return (
			<MediaPlaceholder
				icon={ this.getIcon( false ) }
				labels={ {
					title: __( 'Media area' ),
				} }
				onSelect={ this.onSelectMediaUploadOption }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				onFocus={ this.props.onFocus }
				onError={ this.onUploadError }
			/>
		);
	}

	render() {
		const { mediaUrl, mediaId, mediaType, onSetOpenPickerRef } = this.props;
		const coverUrl = mediaType === MEDIA_TYPE_IMAGE ? mediaUrl : null;

		if ( mediaUrl ) {
			return (
				<View>
					<MediaUpload
						onSelect={ this.onSelectMediaUploadOption }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						value={ mediaId }
						render={ ( { open, getMediaOptions } ) => {
							onSetOpenPickerRef( open );

							return (
								<View style={ { flex: 1 } }>
									{ getMediaOptions() }

									<MediaUploadProgress
										coverUrl={ coverUrl }
										mediaId={ mediaId }
										onUpdateMediaProgress={
											this.updateMediaProgress
										}
										onFinishMediaUploadWithSuccess={
											this.finishMediaUploadWithSuccess
										}
										onFinishMediaUploadWithFailure={
											this.finishMediaUploadWithFailure
										}
										onMediaUploadStateReset={
											this.mediaUploadStateReset
										}
										renderContent={ ( params ) => {
											return (
												<View style={ styles.content }>
													{ this.renderContent(
														params,
														open
													) }
												</View>
											);
										} }
									/>
								</View>
							);
						} }
					/>
				</View>
			);
		}
		return this.renderPlaceholder();
	}
}

export default compose(
	withNotices,
	withPreferredColorScheme
)( MediaContainer );
