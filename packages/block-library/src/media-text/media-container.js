/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ResizableBox, Spinner } from '@wordpress/components';
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
import { isBlobURL } from '@wordpress/blob';
import { store as noticesStore } from '@wordpress/notices';
import { media as icon } from '@wordpress/icons';
export const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
const noop = () => {};

export function imageFillStyles( focalPoint ) {
	return {
		objectPosition: focalPoint
			? `${ Math.round( focalPoint.x * 100 ) }% ${ Math.round(
					focalPoint.y * 100
			  ) }%`
			: `50% 50%`,
	};
}

export function focalPosition( { x, y } = DEFAULT_FOCAL_POINT ) {
	return `${ Math.round( x * 100 ) }% ${ Math.round( y * 100 ) }%`;
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

function PlaceholderContainer( { className, mediaUrl, onSelectMedia } ) {
	const { createErrorNotice } = useDispatch( noticesStore );

	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
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
			onError={ onUploadError }
			disableMediaButtons={ mediaUrl }
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
		enableResize,
	} = props;

	const isTemporaryMedia = ! mediaId && isBlobURL( mediaUrl );

	const { toggleSelection } = useDispatch( blockEditorStore );

	if ( mediaUrl ) {
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
			right: enableResize && mediaPosition === 'left',
			left: enableResize && mediaPosition === 'right',
		};

		const mediaStyles = imageFill ? imageFillStyles( focalPoint ) : {};

		const mediaTypeRenderers = {
			image: () => (
				<img src={ mediaUrl } alt={ mediaAlt } style={ mediaStyles } />
			),
			video: () => (
				<video controls src={ mediaUrl } style={ mediaStyles } />
			),
		};

		return (
			<ResizableBoxContainer
				as="figure"
				className={ classnames(
					className,
					'editor-media-container__resizer',
					{ 'is-transient': isTemporaryMedia }
				) }
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
				{ isTemporaryMedia && <Spinner /> }
				<PlaceholderContainer { ...props } />
			</ResizableBoxContainer>
		);
	}

	return <PlaceholderContainer { ...props } />;
}

export default forwardRef( MediaContainer );
