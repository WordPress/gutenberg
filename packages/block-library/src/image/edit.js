/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { Placeholder } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	BlockIcon,
	MediaPlaceholder,
	useBlockProps,
	store as blockEditorStore,
	__experimentalUseBorderProps as useBorderProps,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image as icon, plugins as pluginsIcon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
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
	const [ temporaryURL, setTemporaryURL ] = useState();

	const altRef = useRef();
	useEffect( () => {
		altRef.current = alt;
	}, [ alt ] );

	const captionRef = useRef();
	useEffect( () => {
		captionRef.current = caption;
	}, [ caption ] );

	const { __unstableMarkNextChangeAsNotPersistent } =
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
	}, [ align ] );

	const ref = useRef();
	const { getSettings } = useSelect( blockEditorStore );
	const blockEditingMode = useBlockEditingMode();

	const { createErrorNotice } = useDispatch( noticesStore );
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
				sizeSlug: getSettings().imageDefaultSize,
			} );
		}
	}

	let isTemp = isTemporaryImage( id, url );

	// Upload a temporary image on mount.
	useEffect( () => {
		if ( ! isTemp ) {
			return;
		}

		const file = getBlobByURL( url );

		if ( file ) {
			const { mediaUpload } = getSettings();
			if ( ! mediaUpload ) {
				return;
			}
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
			!! borderProps.className ||
			( borderProps.style &&
				Object.keys( borderProps.style ).length > 0 ),
	} );

	const blockProps = useBlockProps( {
		ref,
		className: classes,
	} );

	// Much of this description is duplicated from MediaPlaceholder.
	const { lockUrlControls = false } = useSelect(
		( select ) => {
			if ( ! isSingleSelected ) {
				return {};
			}

			const { getBlockBindingsSource } = unlock(
				select( blockEditorStore )
			);

			return {
				lockUrlControls:
					!! metadata?.bindings?.url &&
					getBlockBindingsSource( metadata?.bindings?.url?.source )
						?.lockAttributesEditing === true,
			};
		},
		[ isSingleSelected ]
	);
	const placeholder = ( content ) => {
		return (
			<Placeholder
				className={ classnames( 'block-editor-media-placeholder', {
					[ borderProps.className ]:
						!! borderProps.className && ! isSingleSelected,
				} ) }
				withIllustration={ true }
				icon={ lockUrlControls ? pluginsIcon : icon }
				label={ __( 'Image' ) }
				instructions={
					! lockUrlControls &&
					__(
						'Upload an image file, pick one from your media library, or add one with a URL.'
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
				} }
			>
				{ lockUrlControls ? (
					<span
						className={ 'block-bindings-media-placeholder-message' }
					>
						{ __( 'Connected to a custom field' ) }
					</span>
				) : (
					content
				) }
			</Placeholder>
		);
	};

	return (
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
				containerRef={ ref }
				context={ context }
				clientId={ clientId }
				blockEditingMode={ blockEditingMode }
			/>
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				onSelect={ onSelectImage }
				onSelectURL={ onSelectURL }
				onError={ onUploadError }
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
