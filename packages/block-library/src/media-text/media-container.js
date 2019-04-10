/**
 * WordPress dependencies
 */
import {
	ResizableBox,
} from '@wordpress/components';
import {
	BlockIcon,
	MediaPlaceholder,
} from '@wordpress/block-editor';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './media-container-icon';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export function imageFillStyles( url, focalPoint ) {
	return url ?
		{
			backgroundImage: `url(${ url })`,
			backgroundPosition: focalPoint ? `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%` : `50% 50%`,
		} :
		{};
}

class MediaContainer extends Component {
	renderImage() {
		const { mediaAlt, mediaUrl, className, imageFill, focalPoint } = this.props;
		const backgroundStyles = imageFill ? imageFillStyles( mediaUrl, focalPoint ) : {};
		return (
			<Fragment>
				<figure className={ className } style={ backgroundStyles }>
					<img src={ mediaUrl } alt={ mediaAlt } />
				</figure>
			</Fragment>
		);
	}

	renderVideo() {
		const { mediaUrl, className } = this.props;
		return (
			<Fragment>
				<figure className={ className }>
					<video controls src={ mediaUrl } />
				</figure>
			</Fragment>
		);
	}

	renderPlaceholder() {
		const {
			mediaUrl,
			mediaId,
			toggleIsEditing,
			onSelectMedia,
			onSelectUrl,
			className,
		} = this.props;

		const labels = {
			title: ! mediaUrl ? __( 'Media' ) : __( 'Edit media' ),
		};

		const mediaPreview = ( !! mediaUrl && <img
			alt={ __( 'Edit media' ) }
			title={ __( 'Edit media' ) }
			className={ 'edit-image-preview' }
			src={ mediaUrl }
		/> );

		return (

			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				className={ className }
				labels={ labels }
				onSelect={ onSelectMedia }
				onSelectURL={ onSelectUrl }
				onDoubleClick={ toggleIsEditing }
				onCancel={ !! mediaUrl && toggleIsEditing }
				onError={ this.onUploadError }
				accept="image/*,video/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				value={ { mediaId, mediaUrl } }
				mediaPreview={ mediaPreview }
			/>
		);
	}

	render() {
		const { isEditing, mediaPosition, mediaType, mediaWidth, commitWidthChange, onWidthChange } = this.props;
		if ( isEditing ) {
			return this.renderPlaceholder();
		}
		const onResize = ( event, direction, elt ) => {
			onWidthChange( parseInt( elt.style.width ) );
		};
		const onResizeStop = ( event, direction, elt ) => {
			commitWidthChange( parseInt( elt.style.width ) );
		};
		const enablePositions = {
			right: mediaPosition === 'left',
			left: mediaPosition === 'right',
		};

		let mediaElement = null;
		switch ( mediaType ) {
			case 'image':
				mediaElement = this.renderImage();
				break;
			case 'video':
				mediaElement = this.renderVideo();
				break;
		}
		return (
			<ResizableBox
				className="editor-media-container__resizer"
				size={ { width: mediaWidth + '%' } }
				minWidth="10%"
				maxWidth="100%"
				enable={ enablePositions }
				onResize={ onResize }
				onResizeStop={ onResizeStop }
				axis="x"
			>
				{ mediaElement }
			</ResizableBox>
		);
	}
}

export default MediaContainer;
