/**
 * External dependencies
 */
import { View, Image, ImageBackground } from 'react-native';

/**
 * WordPress dependencies
 */
import { IconButton, Toolbar, withNotices } from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaUpload,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './media-container-icon';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export function calculatePreferedImageSize( image, container ) {
	const maxWidth = container.clientWidth;
	const exceedMaxWidth = image.width > maxWidth;
	const ratio = image.height / image.width;
	const width = exceedMaxWidth ? maxWidth : image.width;
	const height = exceedMaxWidth ? maxWidth * ratio : image.height;
	return { width, height };
}

class MediaContainer extends Component {
	constructor() {
		super( ...arguments );
		this.onUploadError = this.onUploadError.bind( this );
		this.calculateSize = this.calculateSize.bind( this );
		this.onLayout = this.onLayout.bind( this );

		this.state = {
			width: 0,
			height: 0,
		};

		if ( this.props.mediaUrl ) {
			this.onMediaChange();
		}
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	renderToolbarEditButton() {
		const { mediaId, onSelectMedia } = this.props;
		return (
			<BlockControls>
				<Toolbar>
					<MediaUpload
						onSelect={ onSelectMedia }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						value={ mediaId }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit media' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
				</Toolbar>
			</BlockControls>
		);
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.mediaUrl !== this.props.mediaUrl ) {
			this.onMediaChange();
		}
	}

	onMediaChange() {
		const mediaType = this.props.mediaType;
		if ( mediaType === 'video' ) {

		} else if ( mediaType === 'image' ) {
			Image.getSize( this.props.mediaUrl, ( width, height ) => {
				this.media = { width, height };
				this.calculateSize();
			} );
		}
	}

	calculateSize() {
		if ( this.media === undefined || this.container === undefined ) {
			return;
		}

		const { width, height } = calculatePreferedImageSize( this.media, this.container );
		this.setState( { width, height } );
	}

	onLayout( event ) {
		const { width, height } = event.nativeEvent.layout;
		this.container = {
			clientWidth: width,
			clientHeight: height,
		};
		this.calculateSize();
	}

	renderImage() {
		const { mediaAlt, mediaUrl } = this.props;

		return (
			<View onLayout={ this.onLayout }>
				<ImageBackground
					accessible={ true }
					//disabled={ ! isSelected }
					accessibilityLabel={ mediaAlt }
					accessibilityHint={ __( 'Double tap and hold to edit' ) }
					accessibilityRole={ 'imagebutton' }
					style={ { width: this.state.width, height: this.state.height } }
					resizeMethod="scale"
					source={ { uri: mediaUrl } }
					key={ mediaUrl }
				>
				</ImageBackground>
			</View>
		);
	}

	renderVideo() {
		const style = { videoContainer: {} };
		return (
			<View onLayout={ this.onLayout }>
				<View style={ style.videoContainer }>
					{ /* TODO: show video preview */ }
				</View>
			</View>
		);
	}

	renderPlaceholder() {
		const { onSelectMedia, noticeUI } = this.props;
		return (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				labels={ {
					title: __( 'Media area' ),
				} }
				onSelect={ onSelectMedia }
				accept="image/*,video/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				notices={ noticeUI }
				onError={ this.onUploadError }
			/>
		);
	}

	render() {
		const { mediaUrl, mediaType } = this.props;
		if ( mediaType && mediaUrl ) {
			let mediaElement = null;
			switch ( mediaType ) {
				case 'image':
					mediaElement = this.renderImage();
					break;
				case 'video':
					mediaElement = this.renderVideo();
					break;
			}
			return mediaElement;
		}
		return this.renderPlaceholder();
	}
}

export default withNotices( MediaContainer );
