/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	requestImageFullscreenPreview,
} from '@wordpress/react-native-bridge';
import { Icon, Image, IMAGE_DEFAULT_FOCAL_POINT } from '@wordpress/components';
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
import { withDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

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

const ICON_TYPE = {
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
};

export { imageFillStyles } from './media-container.js';

class MediaContainer extends Component {
	constructor() {
		super( ...arguments );
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
		// the editor wasn't open.
		if ( mediaId && mediaUrl && getProtocol( mediaUrl ) === 'file:' ) {
			mediaUploadSync();
		}
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

	getIcon( iconType ) {
		const { mediaType, getStylesFromColorScheme } = this.props;
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				iconStyle =
					mediaType === MEDIA_TYPE_IMAGE
						? styles.iconRetry
						: getStylesFromColorScheme(
								styles.iconRetryVideo,
								styles.iconRetryVideoDark
						  );

				return <Icon icon={ SvgIconRetry } { ...iconStyle } />;
			case ICON_TYPE.PLACEHOLDER:
				iconStyle = getStylesFromColorScheme(
					styles.iconPlaceholder,
					styles.iconPlaceholderDark
				);
				break;
		}
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
		const { createErrorNotice } = this.props;

		createErrorNotice( __( 'Failed to insert media.' ) );

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
			aligmentStyles,
			focalPoint,
			imageFill,
			isMediaSelected,
			isSelected,
			mediaAlt,
			mediaUrl,
			mediaWidth,
			shouldStack,
		} = this.props;
		const { isUploadFailed, retryMessage } = params;
		const focalPointValues = ! focalPoint
			? IMAGE_DEFAULT_FOCAL_POINT
			: focalPoint;

		return (
			<View
				style={ [
					imageFill && styles.imageWithFocalPoint,
					imageFill &&
						shouldStack && {
							height: styles.imageFill.height,
						},
				] }
			>
				<TouchableWithoutFeedback
					accessible={ ! isSelected }
					onPress={ this.onMediaPressed }
					onLongPress={ openMediaOptions }
					disabled={ ! isSelected }
				>
					<View
						style={ [
							imageFill && styles.imageCropped,
							styles.mediaImageContainer,
							! isUploadInProgress && aligmentStyles,
						] }
					>
						<Image
							align="center"
							alt={ mediaAlt }
							focalPoint={ imageFill && focalPointValues }
							isSelected={ isMediaSelected }
							isUploadFailed={ isUploadFailed }
							isUploadInProgress={ isUploadInProgress }
							onSelectMediaUploadOption={
								this.onSelectMediaUploadOption
							}
							openMediaOptions={ openMediaOptions }
							retryMessage={ retryMessage }
							url={ mediaUrl }
							width={ ! isUploadInProgress && mediaWidth }
						/>
					</View>
				</TouchableWithoutFeedback>
			</View>
		);
	}

	renderVideo( params, openMediaOptions ) {
		const {
			aligmentStyles,
			mediaUrl,
			isSelected,
			getStylesFromColorScheme,
		} = this.props;
		const { isUploadInProgress } = this.state;
		const { isUploadFailed, retryMessage } = params;
		const showVideo =
			isURL( mediaUrl ) && ! isUploadInProgress && ! isUploadFailed;

		const videoPlaceholderStyles = getStylesFromColorScheme(
			styles.videoPlaceholder,
			styles.videoPlaceholderDark
		);
		const retryVideoTextStyles = [
			styles.uploadFailedText,
			getStylesFromColorScheme(
				styles.uploadFailedTextVideo,
				styles.uploadFailedTextVideoDark
			),
		];

		return (
			<View style={ styles.mediaVideo }>
				<TouchableWithoutFeedback
					accessible={ ! isSelected }
					onPress={ this.onMediaPressed }
					onLongPress={ openMediaOptions }
					disabled={ ! isSelected }
				>
					<View style={ [ styles.videoContainer, aligmentStyles ] }>
						<View
							style={ [
								styles.videoContent,
								{
									aspectRatio: VIDEO_ASPECT_RATIO,
								},
							] }
						>
							{ showVideo && (
								<View style={ styles.videoPlayer }>
									<VideoPlayer
										isSelected={ isSelected }
										style={ styles.video }
										source={ { uri: mediaUrl } }
										paused={ true }
									/>
								</View>
							) }
							{ ! showVideo && (
								<View style={ videoPlaceholderStyles }>
									<View style={ styles.modalIcon }>
										{ isUploadFailed
											? this.getIcon( ICON_TYPE.RETRY )
											: this.getIcon(
													ICON_TYPE.PLACEHOLDER
											  ) }
									</View>
									{ isUploadFailed && (
										<Text style={ retryVideoTextStyles }>
											{ retryMessage }
										</Text>
									) }
								</View>
							) }
						</View>
					</View>
				</TouchableWithoutFeedback>
			</View>
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
				icon={ this.getIcon( ICON_TYPE.PLACEHOLDER ) }
				labels={ {
					title: __( 'Media area' ),
				} }
				onSelect={ this.onSelectMediaUploadOption }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				onFocus={ this.props.onFocus }
			/>
		);
	}

	render() {
		const { mediaUrl, mediaId, mediaType, onSetOpenPickerRef } = this.props;
		const coverUrl = mediaType === MEDIA_TYPE_IMAGE ? mediaUrl : null;

		if ( mediaUrl ) {
			return (
				<MediaUpload
					isReplacingMedia={ true }
					onSelect={ this.onSelectMediaUploadOption }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ mediaId }
					render={ ( { open, getMediaOptions } ) => {
						onSetOpenPickerRef( open );

						return (
							<>
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
										return this.renderContent(
											params,
											open
										);
									} }
								/>
							</>
						);
					} }
				/>
			);
		}
		return this.renderPlaceholder();
	}
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { createErrorNotice } = dispatch( noticesStore );

		return { createErrorNotice };
	} ),
	withPreferredColorScheme,
] )( MediaContainer );
