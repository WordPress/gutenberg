/**
 * WordPress dependencies
 */
import { ResizableBox, withNotices } from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaReplaceFlow,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';

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
	constructor() {
		super( ...arguments );
		this.onUploadError = this.onUploadError.bind( this );
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	renderToolbarEditButton() {
		const { onSelectMedia, onSelectURL, mediaUrl } = this.props;
		return (
			<BlockControls>
				<MediaReplaceFlow
					mediaURL={ mediaUrl }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					accept="image/*,video/*"
					onSelect={ onSelectMedia }
					onSelectURL={ onSelectURL }
				/>
			</BlockControls>
		);
	}

	renderImage() {
		const { mediaAlt, mediaUrl, className, imageFill, focalPoint } = this.props;
		const backgroundStyles = imageFill ? imageFillStyles( mediaUrl, focalPoint ) : {};
		return (
			<>
				{ this.renderToolbarEditButton() }
				<figure className={ className } style={ backgroundStyles }>
					<img src={ mediaUrl } alt={ mediaAlt } />
				</figure>
			</>
		);
	}

	renderVideo() {
		const { mediaUrl, className } = this.props;
		return (
			<>
				{ this.renderToolbarEditButton() }
				<figure className={ className }>
					<video controls src={ mediaUrl } />
				</figure>
			</>
		);
	}

	renderPlaceholder() {
		const { onSelectMedia, className, noticeUI } = this.props;
		return (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				labels={ {
					title: __( 'Media area' ),
				} }
				className={ className }
				onSelect={ onSelectMedia }
				accept="image/*,video/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				notices={ noticeUI }
				onError={ this.onUploadError }
			/>
		);
	}

	render() {
		const { mediaPosition, mediaUrl, mediaType, mediaWidth, commitWidthChange, onWidthChange, toggleSelection } = this.props;
		if ( mediaType && mediaUrl ) {
			const onResizeStart = () => {
				toggleSelection( false );
			};
			const onResize = ( event, direction, elt ) => {
				onWidthChange( parseInt( elt.style.width ) );
			};
			const onResizeStop = ( event, direction, elt ) => {
				toggleSelection( true );
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
					onResizeStart={ onResizeStart }
					onResize={ onResize }
					onResizeStop={ onResizeStop }
					axis="x"
				>
					{ mediaElement }
				</ResizableBox>
			);
		}
		return this.renderPlaceholder();
	}
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { toggleSelection } = dispatch( 'core/block-editor' );

		return {
			toggleSelection,
		};
	} ),
	withNotices,
] )( MediaContainer );
