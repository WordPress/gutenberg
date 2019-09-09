/**
 * External dependencies
 */
import { Dimensions, View, ImageBackground } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	Icon,
	IconButton,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	VideoPlayer,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import icon from './media-container-icon';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ];
// Default Video ratio 16:9
const VIDEO_ASPECT_RATIO = 16 / 9;
const VIDEO_EXTENSIONS = [ 'mp4', 'm4v', 'webm', 'ogv', 'flv' ];

class MediaContainer extends Component {
	constructor() {
		super( ...arguments );
		this.onUploadError = this.onUploadError.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.onSelectMediaUploadOption = this.onSelectMediaUploadOption.bind( this );

		this.state = {
			isUploadInProgress: false,
		};
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	onSelectMediaUploadOption( params ) {
		const { id, url } = params;
		const { onSelectMedia } = this.props;

		console.log(params)

		onSelectMedia( {
			id,
			url,
		} );
	}


	getIcon( isRetryIcon ) {
		if ( isRetryIcon ) {
			// return <Icon icon={ SvgIconRetry } { ...styles.iconRetry } />;
		}

		return <Icon icon={ icon } { ...styles.icon } />;
	}

	renderToolbarEditButton() {
		const { mediaId } = this.props;
		return (
			<BlockControls>
				<Toolbar>
					<MediaUpload
						onSelect={ this.onSelectMediaUploadOption }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						value={ mediaId }
						render={ ( { open, getMediaOptions } ) => {
							return <>
								{ getMediaOptions() }
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit media' ) }
									icon="edit"
									onClick={ open }
								/>
							</>;
						} }
					/>
				</Toolbar>
			</BlockControls>
		);
	}

	updateMediaProgress( params ) {
		console.log('Progress', params)
		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { onMediaUpdate } = this.props;

		console.log('Success', payload)

		onMediaUpdate( {
			id: payload.mediaServerId,
			url: payload.mediaUrl,
		} );
		this.setState( { isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		console.log('FAILURE')
		// console.log(payload)

		// const { onSelectMedia } = this.props;

		// onSelectMedia( { mediaId: payload.mediaId } );
		// this.setState( { isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { onSelectMedia } = this.props;
		console.log('RESEt')

		// onSelectMedia( { mediaId: null, mediaUrl: null } );
		// this.setState( { isUploadInProgress: false } );
	}

	renderImage( params ) {
		const { isUploadInProgress } = this.state;
		const { mediaAlt, mediaUrl } = this.props;
		const { finalWidth, finalHeight, imageWidthWithinContainer } = params;
		const opacity = isUploadInProgress ? 0.3 : 1;

		return (
			<View style={ { flex: 1 } } >
				{ ! imageWidthWithinContainer &&
					<View style={ [ styles.imageContainer ] } >
						{ this.getIcon( false ) }
					</View> }
				<ImageBackground
					accessible={ true }
					accessibilityLabel={ mediaAlt }
					accessibilityHint={ __( 'Double tap and hold to edit' ) }
					accessibilityRole={ 'imagebutton' }
					style={ { width: finalWidth, height: finalHeight, opacity } }
					resizeMethod="scale"
					source={ { uri: mediaUrl } }
					key={ mediaUrl }
				/>
			</View>
		);
	}

	renderVideo( params ) {
		const { mediaUrl } = this.props;

		const videoHeight = ( Dimensions.get( 'window' ).width / 2 ) / VIDEO_ASPECT_RATIO;

		return (
			<View style={ styles.videoContainer }>
				<VideoPlayer
					isSelected={ true }
					style={ [ styles.video, { height: videoHeight } ] }
					source={ { uri: mediaUrl } }
					paused={ true }
				/>
			</View>
		);
	}

	renderContent( params ) {
		const { mediaType } = this.props;
		let mediaElement = null;

		console.log(this.props)

		switch ( mediaType ) {
			case 'image':
				mediaElement = this.renderImage( params );
				break;
			case 'video':
				mediaElement = this.renderVideo( params );
				break;
		}
		return mediaElement;
	}

	renderPlaceholder() {
		return (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
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
		const { mediaUrl, mediaType, mediaId } = this.props;

		if ( mediaUrl ) {
			return <>
				{ this.renderToolbarEditButton() }

				<MediaUploadProgress
					coverUrl={ mediaUrl }
					mediaId={ mediaId }
					onUpdateMediaProgress={ this.updateMediaProgress }
					onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
					onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
					onMediaUploadStateReset={ this.mediaUploadStateReset }
					renderContent={ ( params ) => {
						return (
							<View style={ { flex: 1 } } >
								{ this.renderContent( params ) }
							</View>
						);
					} }
				/>
			</>;
		}
		return this.renderPlaceholder();
	}
}

export default withNotices( MediaContainer );
