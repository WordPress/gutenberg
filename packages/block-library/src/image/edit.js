/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { Placeholder } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	BlockAlignmentControl,
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	useBlockProps,
	store as blockEditorStore,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image as icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { pasteHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Image from './image';

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
 * Is the URL a temporary blob URL? A blob URL is one that is used temporarily
 * while the image is being uploaded and will not have an id yet allocated.
 *
 * @param {number=} id  The id of the image.
 * @param {string=} url The url of the image.
 *
 * @return {boolean} Is the URL a Blob URL
 */
const isTemporaryImage = ( id, url ) => ! id && isBlobURL( url );

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
 * Checks if WP generated default image size. Size generation is skipped
 * when the image is smaller than the said size.
 *
 * @param {Object} image
 * @param {string} defaultSize
 *
 * @return {boolean} Whether or not it has default image size.
 */
function hasDefaultSize( image, defaultSize ) {
	return (
		'url' in ( image?.sizes?.[ defaultSize ] ?? {} ) ||
		'source_url' in ( image?.media_details?.sizes?.[ defaultSize ] ?? {} )
	);
}

export function ImageEdit( {
	attributes,
	setAttributes,
	isSelected,
	className,
	insertBlocksAfter,
	onReplace,
	context,
	clientId,
} ) {
	const {
		url = '',
		alt,
		caption,
		align,
		id,
		width,
		height,
		sizeSlug,
	} = attributes;
	const [ temporaryURL, setTemporaryURL ] = useState();

	const altRef = useRef();
	useEffect( () => {
		altRef.current = alt;
	}, [ alt ] );

	const captionRef = useRef();
	useEffect( () => {
		captionRef.current = caption;
	}, [ caption ] );

	const ref = useRef();
	const { imageDefaultSize, mediaUpload, isContentLocked } = useSelect(
		( select ) => {
			const { getSettings, __unstableGetContentLockingParent } =
				select( blockEditorStore );
			const settings = getSettings();
			return {
				imageDefaultSize: settings.imageDefaultSize,
				mediaUpload: settings.mediaUpload,
				isContentLocked:
					!! __unstableGetContentLockingParent( clientId ),
			};
		},
		[]
	);

	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { __unstableMarkNextChangeAsNotPersistent, selectBlock } =
		useDispatch( blockEditorStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
		setAttributes( {
			src: undefined,
			id: undefined,
			url: undefined,
		} );
		setTemporaryURL( undefined );
	}

	function onSelectImage( media ) {
		if ( ! media || ! media.url ) {
			setAttributes( {
				url: undefined,
				alt: undefined,
				id: undefined,
				title: undefined,
				caption: undefined,
			} );

			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		setTemporaryURL();

		let mediaAttributes = pickRelevantMediaFiles( media, imageDefaultSize );

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
				width: undefined,
				height: undefined,
				// Fallback to size "full" if there's no default image size.
				// It means the image is smaller, and the block will use a full-size URL.
				sizeSlug: hasDefaultSize( media, imageDefaultSize )
					? imageDefaultSize
					: 'full',
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
			...mediaAttributes,
			...additionalAttributes,
			linkDestination,
		} );
	}

	function onSelectURL( newURL ) {
		if ( newURL !== url ) {
			setAttributes( {
				url: newURL,
				id: undefined,
				width: undefined,
				height: undefined,
				sizeSlug: imageDefaultSize,
			} );
		}
	}

	function updateAlignment( nextAlign ) {
		const extraUpdatedAttributes = [ 'wide', 'full' ].includes( nextAlign )
			? { width: undefined, height: undefined }
			: {};
		setAttributes( {
			...extraUpdatedAttributes,
			align: nextAlign,
		} );
	}

	let isTemp = isTemporaryImage( id, url );

	// Upload a temporary image on mount.
	useEffect( () => {
		if ( ! isTemp ) {
			return;
		}

		const file = getBlobByURL( url );

		if ( file ) {
			mediaUpload( {
				filesList: [ file ],
				onFileChange: ( [ img ] ) => {
					onSelectImage( img );
				},
				allowedTypes: ALLOWED_MEDIA_TYPES,
				onError: ( message ) => {
					isTemp = false;
					onUploadError( message );
				},
			} );
		}
	}, [] );

	// If an image is temporary, revoke the Blob url when it is uploaded (and is
	// no longer temporary).
	useEffect( () => {
		if ( isTemp ) {
			setTemporaryURL( url );
			return;
		}
		revokeBlobURL( temporaryURL );
	}, [ isTemp, url ] );

	const isExternal = isExternalImage( id, url );
	const src = isExternal ? url : undefined;
	const mediaPreview = !! url && (
		<img
			alt={ __( 'Edit image' ) }
			title={ __( 'Edit image' ) }
			className={ 'edit-image-preview' }
			src={ url }
		/>
	);

	const borderProps = useBorderProps( attributes );

	const classes = classnames( className, {
		'is-transient': temporaryURL,
		'is-resized': !! width || !! height,
		[ `size-${ sizeSlug }` ]: sizeSlug,
		'has-custom-border':
			!! borderProps.className || ! isEmpty( borderProps.style ),
	} );

	const blockProps = useBlockProps( {
		ref,
		className: classes,
	} );

	// Much of this description is duplicated from MediaPlaceholder.
	const placeholder = ( content ) => {
		return (
			<Placeholder
				className={ classnames( 'block-editor-media-placeholder', {
					[ borderProps.className ]:
						!! borderProps.className && ! isSelected,
				} ) }
				withIllustration={ true }
				icon={ icon }
				label={ __( 'Image' ) }
				instructions={ __(
					'Upload an image file, pick one from your media library, or add one with a URL.'
				) }
				style={ isSelected ? undefined : borderProps.style }
			>
				{ content }
			</Placeholder>
		);
	};

	async function onHTMLDrop( HTML ) {
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( ! blocks || blocks.length !== 1 ) {
			return;
		}

		const [ block ] = blocks;

		if ( ! block || block.name !== 'core/image' ) {
			return;
		}

		// Optimistic update to replace the current image.
		setAttributes( {
			url: undefined,
			alt: undefined,
			id: undefined,
			title: undefined,
			caption: undefined,
			...block.attributes,
		} );

		// Media item already exists in the library.
		if ( !! block.attributes.id ) {
			selectBlock( clientId );
			return;
		}

		// Media item doesn't exist in the library, upload it so that it
		// can be served within the same origin.
		try {
			// Media item does not exist in library, so try to upload it.
			// Fist fetch the image data. This may fail if the image host
			// doesn't allow CORS with the domain.
			// If this happens, we insert the image block using the external
			// URL and let the user know about the possible implications.
			const response = await window.fetch( block.attributes.url );
			const blob = await response.blob();

			mediaUpload( {
				filesList: [ blob ],
				additionalData: {
					title: block.attributes.title,
					alt_text: block.attributes.alt,
					caption: block.attributes.caption,
				},
				onFileChange( [ img ] ) {
					if ( isBlobURL( img.url ) ) {
						return;
					}

					__unstableMarkNextChangeAsNotPersistent();
					setAttributes( {
						id: img.id,
						url: img.url,
					} );
					createSuccessNotice(
						__( 'Image uploaded to the media library.' ),
						{ type: 'snackbar' }
					);
				},
				allowedTypes: ALLOWED_MEDIA_TYPES,
				onError( message ) {
					createErrorNotice( message, { type: 'snackbar' } );
				},
			} );
		} catch ( err ) {
			// TODO: Ignore cross-origin image errors for now.
		} finally {
			selectBlock( clientId );
		}
	}

	return (
		<figure { ...blockProps }>
			{ ( temporaryURL || url ) && (
				<Image
					temporaryURL={ temporaryURL }
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					insertBlocksAfter={ insertBlocksAfter }
					onReplace={ onReplace }
					onSelectImage={ onSelectImage }
					onSelectURL={ onSelectURL }
					onUploadError={ onUploadError }
					containerRef={ ref }
					context={ context }
					clientId={ clientId }
					isContentLocked={ isContentLocked }
				/>
			) }
			{ ! url && ! isContentLocked && (
				<BlockControls group="block">
					<BlockAlignmentControl
						value={ align }
						onChange={ updateAlignment }
					/>
				</BlockControls>
			) }
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				onSelect={ onSelectImage }
				onSelectURL={ onSelectURL }
				onError={ onUploadError }
				onHTMLDrop={ onHTMLDrop }
				placeholder={ placeholder }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				value={ { id, src } }
				mediaPreview={ mediaPreview }
				disableMediaButtons={ temporaryURL || url }
			/>
		</figure>
	);
}

export default ImageEdit;
