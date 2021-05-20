/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { ResizableBox, withNotices } from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaReplaceFlow,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import icon from './media-container-icon';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export function imageFillStyles( url, focalPoint ) {
	return url
		? {
				backgroundImage: `url(${ url })`,
				backgroundPosition: focalPoint
					? `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`
					: `50% 50%`,
		  }
		: {};
}

const ResizableBoxContainer = forwardRef(
	( { isSelected, isStackedOnMobile, ...props }, ref ) => {
		const isMobile = useViewportMatch( 'small', '<' );
		return (
			<ResizableBox
				ref={ ref }
				showHandle={
					isSelected && ( ! isMobile || ! isStackedOnMobile )
				}
				{ ...props }
			/>
		);
	}
);

function ToolbarEditButton( { mediaId, mediaUrl, onSelectMedia } ) {
	return (
		<BlockControls group="other">
			<MediaReplaceFlow
				mediaId={ mediaId }
				mediaURL={ mediaUrl }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				accept="image/*,video/*"
				onSelect={ onSelectMedia }
			/>
		</BlockControls>
	);
}

function PlaceholderContainer( {
	className,
	noticeOperations,
	noticeUI,
	onSelectMedia,
} ) {
	const onUploadError = ( message ) => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	};

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
			onError={ onUploadError }
		/>
	);
}

function MediaContainer( props, ref ) {
	const {
		className,
		commitWidthChange,
		focalPoint,
		imageFill,
		isSelected,
		isStackedOnMobile,
		mediaAlt,
		mediaId,
		mediaPosition,
		mediaType,
		mediaUrl,
		mediaWidth,
		onSelectMedia,
		onWidthChange,
	} = props;

	const { toggleSelection } = useDispatch( blockEditorStore );

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

		const backgroundStyles =
			mediaType === 'image' && imageFill
				? imageFillStyles( mediaUrl, focalPoint )
				: {};

		const mediaTypeRenderers = {
			image: () => <img src={ mediaUrl } alt={ mediaAlt } />,
			video: () => <video controls src={ mediaUrl } />,
		};

		return (
			<ResizableBoxContainer
				as="figure"
				className={ classnames(
					className,
					'editor-media-container__resizer'
				) }
				style={ backgroundStyles }
				size={ { width: mediaWidth + '%' } }
				minWidth="10%"
				maxWidth="100%"
				enable={ enablePositions }
				onResizeStart={ onResizeStart }
				onResize={ onResize }
				onResizeStop={ onResizeStop }
				axis="x"
				isSelected={ isSelected }
				isStackedOnMobile={ isStackedOnMobile }
				ref={ ref }
			>
				<ToolbarEditButton
					onSelectMedia={ onSelectMedia }
					mediaUrl={ mediaUrl }
					mediaId={ mediaId }
				/>
				{ ( mediaTypeRenderers[ mediaType ] || noop )() }
			</ResizableBoxContainer>
		);
	}

	return <PlaceholderContainer { ...props } />;
}

export default withNotices( forwardRef( MediaContainer ) );
