/**
 * External dependencies
 */
import {
	View,
	ImageBackground,
	Text,
	TouchableWithoutFeedback,
} from 'react-native';
import {
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Icon, Button, ToolbarGroup, withNotices } from '@wordpress/components';
import {
	BlockControls,
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
import { isURL } from '@wordpress/url';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { pencil } from '@wordpress/icons';

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
		if ( mediaId && mediaUrl && mediaUrl.indexOf( 'file:' ) === 0 ) {
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
		const { mediaId, mediaUrl } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( mediaId );
		} else if ( mediaId && ! isURL( mediaUrl ) ) {
			requestImageFailedRetryDialog( mediaId );
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

	renderToolbarEditButton( open ) {
		return (
			<BlockControls>
				<ToolbarGroup>
					<Button
						className="components-toolbar__control"
						label={ __( 'Edit media' ) }
						icon={ pencil }
						onClick={ open }
					/>
				</ToolbarGroup>
			</BlockControls>
		);
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
		const { mediaAlt, mediaUrl, isSelected } = this.props;
		const {
			finalWidth,
			finalHeight,
			imageWidthWithinContainer,
			isUploadFailed,
			retryMessage,
		} = params;
		const opacity = isUploadInProgress ? 0.3 : 1;

		const contentStyle = ! imageWidthWithinContainer
			? styles.content
			: styles.contentCentered;

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				onPress={ this.onMediaPressed }
				onLongPress={ openMediaOptions }
				disabled={ ! isSelected }
			>
				<View style={ contentStyle }>
					{ ! imageWidthWithinContainer && (
						<View style={ styles.imageContainer }>
							{ this.getIcon( false ) }
						</View>
					) }
					<ImageBackground
						accessible={ true }
						accessibilityLabel={ mediaAlt }
						accessibilityHint={ __(
							'Double tap and hold to edit'
						) }
						accessibilityRole={ 'imagebutton' }
						style={ {
							width: finalWidth,
							height: finalHeight,
							opacity,
						} }
						resizeMethod="scale"
						source={ { uri: mediaUrl } }
						key={ mediaUrl }
					>
						{ isUploadFailed && (
							<View
								style={ [
									styles.imageContainer,
									styles.uploadFailed,
								] }
							>
								<View style={ styles.modalIcon }>
									{ this.getIcon( isUploadFailed ) }
								</View>
								<Text style={ styles.uploadFailedText }>
									{ retryMessage }
								</Text>
							</View>
						) }
					</ImageBackground>
				</View>
			</TouchableWithoutFeedback>
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
		const { mediaUrl, mediaId, mediaType } = this.props;
		const coverUrl = mediaType === MEDIA_TYPE_IMAGE ? mediaUrl : null;

		if ( mediaUrl ) {
			return (
				<View>
					<MediaUpload
						onSelect={ this.onSelectMediaUploadOption }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						value={ mediaId }
						render={ ( { open, getMediaOptions } ) => {
							return (
								<View style={ { flex: 1 } }>
									{ getMediaOptions() }
									{ this.renderToolbarEditButton( open ) }

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
