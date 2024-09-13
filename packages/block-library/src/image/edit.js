/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { isBlobURL, createBlobURL } from '@wordpress/blob';
import { store as blocksStore, createBlock } from '@wordpress/blocks';
import { Placeholder } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	BlockIcon,
	useBlockProps,
	MediaPlaceholder,
	store as blockEditorStore,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { image as icon, plugins as pluginsIcon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { useUploadMediaFromBlobURL } from '../utils/hooks';
import Image from './image';
import { isValidFileType } from './utils';
import { useMaxWidthObserver } from './use-max-width-observer';

/**
 * Module constants
 */
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_CUSTOM,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
	ALLOWED_MEDIA_TYPES,
} from './constants';

export const pickRelevantMediaFiles = ( image, size ) => {
	const imageProps = Object.fromEntries(
		Object.entries( image ?? {} ).filter( ( [ key ] ) =>
			[ 'alt', 'id', 'link', 'caption' ].includes( key )
		)
	);

	imageProps.url =
		image?.sizes?.[ size ]?.url ||
		image?.media_details?.sizes?.[ size ]?.source_url ||
		image.url;
	return imageProps;
};

/**
 * Is the url for the image hosted externally. An externally hosted image has no
 * id and is not a blob url.
 *
 * @param {number=} id  The id of the image.
 * @param {string=} url The url of the image.
 *
 * @return {boolean} Is the url an externally hosted url?
 */
export const isExternalImage = ( id, url ) => url && ! id && ! isBlobURL( url );

/**
 * Checks if WP generated the specified image size. Size generation is skipped
 * when the image is smaller than the said size.
 *
 * @param {Object} image
 * @param {string} size
 *
 * @return {boolean} Whether or not it has default image size.
 */
function hasSize( image, size ) {
	return (
		'url' in ( image?.sizes?.[ size ] ?? {} ) ||
		'source_url' in ( image?.media_details?.sizes?.[ size ] ?? {} )
	);
}

export function ImageEdit( {
	attributes,
	setAttributes,
	isSelected: isSingleSelected,
	className,
	insertBlocksAfter,
	onReplace,
	context,
	clientId,
	__unstableParentLayout: parentLayout,
} ) {
	const {
		url = '',
		alt,
		caption,
		id,
		width,
		height,
		sizeSlug,
		aspectRatio,
		scale,
		align,
		metadata,
	} = attributes;

	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );

	const containerRef = useRef();
	// Only observe the max width from the parent container when the parent layout is not flex nor grid.
	// This won't work for them because the container width changes with the image.
	// TODO: Find a way to observe the container width for flex and grid layouts.
	const isMaxWidthContainerWidth =
		! parentLayout ||
		( parentLayout.type !== 'flex' && parentLayout.type !== 'grid' );
	const [ maxWidthObserver, maxContentWidth ] = useMaxWidthObserver();

	const [ placeholderResizeListener, { width: placeholderWidth } ] =
		useResizeObserver();

	const isSmallContainer = placeholderWidth && placeholderWidth < 160;

	const altRef = useRef();
	useEffect( () => {
		altRef.current = alt;
	}, [ alt ] );

	const captionRef = useRef();
	useEffect( () => {
		captionRef.current = caption;
	}, [ caption ] );

	const { __unstableMarkNextChangeAsNotPersistent, replaceBlock } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		if ( [ 'wide', 'full' ].includes( align ) ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				width: undefined,
				height: undefined,
				aspectRatio: undefined,
				scale: undefined,
			} );
		}
	}, [ __unstableMarkNextChangeAsNotPersistent, align, setAttributes ] );

	const {
		getSettings,
		getBlockRootClientId,
		getBlockName,
		canInsertBlockType,
	} = useSelect( blockEditorStore );
	const blockEditingMode = useBlockEditingMode();

	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
		setAttributes( {
			src: undefined,
			id: undefined,
			url: undefined,
			blob: undefined,
		} );
	}

	function onSelectImagesList( images ) {
		const win = containerRef.current?.ownerDocument.defaultView;

		if ( images.every( ( file ) => file instanceof win.File ) ) {
			/** @type {File[]} */
			const files = images;
			const rootClientId = getBlockRootClientId( clientId );

			if ( files.some( ( file ) => ! isValidFileType( file ) ) ) {
				// Copied from the same notice in the gallery block.
				createErrorNotice(
					__(
						'If uploading to a gallery all files need to be image formats'
					),
					{ id: 'gallery-upload-invalid-file', type: 'snackbar' }
				);
			}

			const imageBlocks = files
				.filter( ( file ) => isValidFileType( file ) )
				.map( ( file ) =>
					createBlock( 'core/image', {
						blob: createBlobURL( file ),
					} )
				);

			if ( getBlockName( rootClientId ) === 'core/gallery' ) {
				replaceBlock( clientId, imageBlocks );
			} else if ( canInsertBlockType( 'core/gallery', rootClientId ) ) {
				const galleryBlock = createBlock(
					'core/gallery',
					{},
					imageBlocks
				);

				replaceBlock( clientId, galleryBlock );
			}
		}
	}

	function onSelectImage( media ) {
		if ( Array.isArray( media ) ) {
			onSelectImagesList( media );
			return;
		}

		if ( ! media || ! media.url ) {
			setAttributes( {
				url: undefined,
				alt: undefined,
				id: undefined,
				title: undefined,
				caption: undefined,
				blob: undefined,
			} );
			setTemporaryURL();

			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		const { imageDefaultSize } = getSettings();

		// Try to use the previous selected image size if its available
		// otherwise try the default image size or fallback to "full"
		let newSize = 'full';
		if ( sizeSlug && hasSize( media, sizeSlug ) ) {
			newSize = sizeSlug;
		} else if ( hasSize( media, imageDefaultSize ) ) {
			newSize = imageDefaultSize;
		}

		let mediaAttributes = pickRelevantMediaFiles( media, newSize );

		// If a caption text was meanwhile written by the user,
		// make sure the text is not overwritten by empty captions.
		if ( captionRef.current && ! mediaAttributes.caption ) {
			const { caption: omittedCaption, ...restMediaAttributes } =
				mediaAttributes;
			mediaAttributes = restMediaAttributes;
		}

		let additionalAttributes;
		// Reset the dimension attributes if changing to a different image.
		if ( ! media.id || media.id !== id ) {
			additionalAttributes = {
				sizeSlug: newSize,
			};
		} else {
			// Keep the same url when selecting the same file, so "Resolution"
			// option is not changed.
			additionalAttributes = { url };
		}

		// Check if default link setting should be used.
		let linkDestination = attributes.linkDestination;
		if ( ! linkDestination ) {
			// Use the WordPress option to determine the proper default.
			// The constants used in Gutenberg do not match WP options so a little more complicated than ideal.
			// TODO: fix this in a follow up PR, requires updating media-text and ui component.
			switch (
				window?.wp?.media?.view?.settings?.defaultProps?.link ||
				LINK_DESTINATION_NONE
			) {
				case 'file':
				case LINK_DESTINATION_MEDIA:
					linkDestination = LINK_DESTINATION_MEDIA;
					break;
				case 'post':
				case LINK_DESTINATION_ATTACHMENT:
					linkDestination = LINK_DESTINATION_ATTACHMENT;
					break;
				case LINK_DESTINATION_CUSTOM:
					linkDestination = LINK_DESTINATION_CUSTOM;
					break;
				case LINK_DESTINATION_NONE:
					linkDestination = LINK_DESTINATION_NONE;
					break;
			}
		}

		// Check if the image is linked to it's media.
		let href;
		switch ( linkDestination ) {
			case LINK_DESTINATION_MEDIA:
				href = media.url;
				break;
			case LINK_DESTINATION_ATTACHMENT:
				href = media.link;
				break;
		}
		mediaAttributes.href = href;

		setAttributes( {
			blob: undefined,
			...mediaAttributes,
			...additionalAttributes,
			linkDestination,
		} );
		setTemporaryURL();
	}

	function onSelectURL( newURL ) {
		if ( newURL !== url ) {
			setAttributes( {
				blob: undefined,
				url: newURL,
				id: undefined,
				sizeSlug: getSettings().imageDefaultSize,
			} );
			setTemporaryURL();
		}
	}

	useUploadMediaFromBlobURL( {
		url: temporaryURL,
		allowedTypes: ALLOWED_MEDIA_TYPES,
		onChange: onSelectImage,
		onError: onUploadError,
	} );

	const isExternal = isExternalImage( id, url );
	const src = isExternal ? url : undefined;
	const mediaPreview = !! url && (
		<img
			alt={ __( 'Edit image' ) }
			title={ __( 'Edit image' ) }
			className="edit-image-preview"
			src={ url }
		/>
	);

	const borderProps = useBorderProps( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );

	const classes = clsx( className, {
		'is-transient': !! temporaryURL,
		'is-resized': !! width || !! height,
		[ `size-${ sizeSlug }` ]: sizeSlug,
		'has-custom-border':
			!! borderProps.className ||
			( borderProps.style &&
				Object.keys( borderProps.style ).length > 0 ),
	} );

	const blockProps = useBlockProps( {
		ref: containerRef,
		className: classes,
	} );

	// Much of this description is duplicated from MediaPlaceholder.
	const { lockUrlControls = false, lockUrlControlsMessage } = useSelect(
		( select ) => {
			if ( ! isSingleSelected ) {
				return {};
			}

			const blockBindingsSource = unlock(
				select( blocksStore )
			).getBlockBindingsSource( metadata?.bindings?.url?.source );

			return {
				lockUrlControls:
					!! metadata?.bindings?.url &&
					! blockBindingsSource?.canUserEditValue?.( {
						select,
						context,
						args: metadata?.bindings?.url?.args,
					} ),
				lockUrlControlsMessage: blockBindingsSource?.label
					? sprintf(
							/* translators: %s: Label of the bindings source. */
							__( 'Connected to %s' ),
							blockBindingsSource.label
					  )
					: __( 'Connected to dynamic data' ),
			};
		},
		[ context, isSingleSelected, metadata?.bindings?.url ]
	);
	const placeholder = ( content ) => {
		return (
			<Placeholder
				className={ clsx( 'block-editor-media-placeholder', {
					[ borderProps.className ]:
						!! borderProps.className && ! isSingleSelected,
				} ) }
				icon={
					! isSmallContainer &&
					( lockUrlControls ? pluginsIcon : icon )
				}
				withIllustration={ ! isSingleSelected || isSmallContainer }
				label={ ! isSmallContainer && __( 'Image' ) }
				instructions={
					! lockUrlControls &&
					! isSmallContainer &&
					__(
						'Upload or drag an image file here, or pick one from your library.'
					)
				}
				style={ {
					aspectRatio:
						! ( width && height ) && aspectRatio
							? aspectRatio
							: undefined,
					width: height && aspectRatio ? '100%' : width,
					height: width && aspectRatio ? '100%' : height,
					objectFit: scale,
					...borderProps.style,
					...shadowProps.style,
				} }
			>
				{ lockUrlControls &&
					! isSmallContainer &&
					lockUrlControlsMessage }

				{ ! lockUrlControls && ! isSmallContainer && content }
				{ placeholderResizeListener }
			</Placeholder>
		);
	};

	return (
		<>
			<figure { ...blockProps }>
				<Image
					temporaryURL={ temporaryURL }
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSingleSelected={ isSingleSelected }
					insertBlocksAfter={ insertBlocksAfter }
					onReplace={ onReplace }
					onSelectImage={ onSelectImage }
					onSelectURL={ onSelectURL }
					onUploadError={ onUploadError }
					context={ context }
					clientId={ clientId }
					blockEditingMode={ blockEditingMode }
					parentLayoutType={ parentLayout?.type }
					maxContentWidth={ maxContentWidth }
				/>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					onSelect={ onSelectImage }
					onSelectURL={ onSelectURL }
					onError={ onUploadError }
					placeholder={ placeholder }
					accept="image/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					handleUpload={ ( files ) => files.length === 1 }
					value={ { id, src } }
					mediaPreview={ mediaPreview }
					disableMediaButtons={ temporaryURL || url }
				/>
			</figure>
			{
				// The listener cannot be placed as the first element as it will break the in-between inserter.
				// See https://github.com/WordPress/gutenberg/blob/71134165868298fc15e22896d0c28b41b3755ff7/packages/block-editor/src/components/block-list/use-in-between-inserter.js#L120
				isSingleSelected && isMaxWidthContainerWidth && maxWidthObserver
			}
		</>
	);
}

export default ImageEdit;
