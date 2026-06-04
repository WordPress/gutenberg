/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { ResizableBox, Spinner, Placeholder } from '@wordpress/components';
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
import { createBlobURL, isBlobURL } from '@wordpress/blob';
import { store as noticesStore } from '@wordpress/notices';
import { media as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { imageFillStyles } from './image-fill';

/**
 * Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
const noop = () => {};

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

function ToolbarEditButton( {
	mediaId,
	mediaUrl,
	onSelectMedia,
	toggleUseFeaturedImage,
	useFeaturedImage,
} ) {
	return (
		<BlockControls group="other">
			<MediaReplaceFlow
				mediaId={ mediaId }
				mediaURL={ mediaUrl }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				onSelect={ onSelectMedia }
				onToggleFeaturedImage={ toggleUseFeaturedImage }
				useFeaturedImage={ useFeaturedImage }
				onReset={ () => onSelectMedia( undefined ) }
			/>
		</BlockControls>
	);
}

function PlaceholderContainer( {
	className,
	dimensionsProps,
	mediaUrl,
	onSelectMedia,
	toggleUseFeaturedImage,
} ) {
	const { createErrorNotice } = useDispatch( noticesStore );

	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const onFilesPreUpload = ( files ) => {
		if ( files.length === 1 ) {
			onSelectMedia( { url: createBlobURL( files[ 0 ] ) } );
		}
	};

	return (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ icon } /> }
			labels={ {
				title: __( 'Media area' ),
			} }
			className={ clsx( className, dimensionsProps.className ) }
			style={ dimensionsProps.style }
			onSelect={ onSelectMedia }
			onToggleFeaturedImage={ toggleUseFeaturedImage }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			onFilesPreUpload={ onFilesPreUpload }
			onError={ onUploadError }
			disableMediaButtons={ mediaUrl }
		/>
	);
}

function MediaContainer( props, ref ) {
	const {
		dimensionsProps,
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
		toggleUseFeaturedImage,
		useFeaturedImage,
		featuredImageURL,
		featuredImageAlt,
		refMedia,
	} = props;

	const isTemporaryMedia = ! mediaId && isBlobURL( mediaUrl );

	const { toggleSelection } = useDispatch( blockEditorStore );

	if ( mediaUrl || featuredImageURL || useFeaturedImage ) {
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

		const imageFillStyle =
			mediaType === 'image' && imageFill
				? imageFillStyles( mediaUrl || featuredImageURL, focalPoint )
				: {};

		const mediaClassName = ! imageFill
			? dimensionsProps.className
			: undefined;

		let mediaStyles = imageFill ? imageFillStyle : dimensionsProps.style;
		if ( ! imageFill && dimensionsProps.className && focalPoint ) {
			mediaStyles = {
				...dimensionsProps.style,
				...imageFillStyles( mediaUrl || featuredImageURL, focalPoint ),
			};
		}

		const mediaTypeRenderers = {
			image: () =>
				useFeaturedImage && featuredImageURL ? (
					<img
						ref={ refMedia }
						src={ featuredImageURL }
						alt={ featuredImageAlt }
						className={ mediaClassName }
						style={ mediaStyles }
					/>
				) : (
					mediaUrl && (
						<img
							ref={ refMedia }
							src={ mediaUrl }
							alt={ mediaAlt }
							className={ mediaClassName }
							style={ mediaStyles }
						/>
					)
				),
			video: () => (
				<video
					controls
					ref={ refMedia }
					src={ mediaUrl }
					className={ dimensionsProps.className }
					style={ dimensionsProps.style }
				/>
			),
		};

		return (
			<ResizableBoxContainer
				as="figure"
				className={ clsx(
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
					mediaUrl={
						useFeaturedImage && featuredImageURL
							? featuredImageURL
							: mediaUrl
					}
					mediaId={ mediaId }
					toggleUseFeaturedImage={ toggleUseFeaturedImage }
					useFeaturedImage={ useFeaturedImage }
				/>
				{ ( mediaTypeRenderers[ mediaType ] || noop )() }
				{ isTemporaryMedia && <Spinner /> }
				{ ! useFeaturedImage && <PlaceholderContainer { ...props } /> }
				{ ! featuredImageURL && useFeaturedImage && (
					<Placeholder
						className={ clsx(
							'wp-block-media-text--placeholder-image',
							dimensionsProps.className
						) }
						style={ {
							...imageFillStyle,
							...dimensionsProps.style,
						} }
						withIllustration
					/>
				) }
			</ResizableBoxContainer>
		);
	}

	return <PlaceholderContainer { ...props } />;
}

export default forwardRef( MediaContainer );
