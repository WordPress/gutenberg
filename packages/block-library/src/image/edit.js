/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, has, omit, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import {
	Button,
	withNotices,
	Placeholder,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	BlockAlignmentControl,
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Image from './image';
import { isMediaFileDeleted } from './utils';

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
	const imageProps = pick( image, [ 'alt', 'id', 'link', 'caption' ] );
	imageProps.url =
		get( image, [ 'sizes', size, 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', size, 'source_url' ] ) ||
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
		has( image, [ 'sizes', defaultSize, 'url' ] ) ||
		has( image, [ 'media_details', 'sizes', defaultSize, 'source_url' ] )
	);
}

/**
 * Checks if a media attachment object has been "destroyed",
 * that is, removed from the media library. The core Media Library
 * adds a `destroyed` property to a deleted attachment object in the media collection.
 *
 * @param {number} id The attachment id.
 *
 * @return {boolean} Whether the image has been destroyed.
 */
export function isMediaDestroyed( id ) {
	const attachment = window?.wp?.media?.attachment( id ) || {};
	return attachment.destroyed;
}

/**
 * A placeholder component that displays if an image has been deleted or cannot be loaded.
 *
 * @param {Object}   props               Component props.
 * @param {number}   props.id            The attachment id.
 * @param {string}   props.url           Image url.
 * @param {Function} props.onClear       Clears the image attributes.
 * @param {Function} props.onSelect      Callback for <MediaReplaceFlow /> when an image is selected.
 * @param {Function} props.onSelectURL   Callback for <MediaReplaceFlow /> when an image URL is selected.
 * @param {Function} props.onUploadError Callback for <MediaReplaceFlow /> when an upload fails.
 * @param {Function} props.onCloseModal  Callback for <MediaReplaceFlow /> when the media library overlay is closed.
 *
 * @return {boolean} Whether the image has been destroyed.
 */
const ImageErrorPlaceholder = ( {
	id,
	url,
	onClear,
	onSelect,
	onSelectURL,
	onUploadError,
	onCloseModal,
} ) => (
	<Placeholder
		className="wp-block-image__error-placeholder"
		icon={ icon }
		label={ __( 'This image could not be loaded' ) }
	>
		<p>{ url }</p>
		<p>
			{ __(
				'This might be due to a network error, or the image may have been deleted.'
			) }
		</p>
		<HStack justify="flex-start" spacing={ 2 }>
			<MediaReplaceFlow
				mediaId={ id }
				mediaURL={ url }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				accept="image/*"
				onSelect={ ( media ) => {
					onClear();
					onSelect( media );
				} }
				onSelectURL={ ( selectedUrl ) => {
					onClear();
					onSelectURL( selectedUrl );
				} }
				onError={ onUploadError }
				onCloseModal={ onCloseModal }
				buttonVariant="primary"
			/>
			<Button
				className="wp-block-image__error-placeholder__button"
				title={ __( 'Clear and replace image' ) }
				variant="secondary"
				onClick={ onClear }
			>
				{ __( 'Clear' ) }
			</Button>
		</HStack>
	</Placeholder>
);

export function ImageEdit( {
	attributes,
	setAttributes,
	isSelected,
	className,
	noticeUI,
	insertBlocksAfter,
	noticeOperations,
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
	const [ hasImageLoadError, setHasImageLoadError ] = useState( false );

	const altRef = useRef();
	useEffect( () => {
		altRef.current = alt;
	}, [ alt ] );

	const captionRef = useRef();
	useEffect( () => {
		captionRef.current = caption;
	}, [ caption ] );

	const ref = useRef();
	const { imageDefaultSize, mediaUpload } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return pick( getSettings(), [ 'imageDefaultSize', 'mediaUpload' ] );
	}, [] );

	// A callback passed to MediaUpload,
	// fired when the media modal closes.
	function onCloseModal() {
		if ( isMediaDestroyed( attributes?.id ) ) {
			setHasImageLoadError( true );
		}
	}

	function clearImageAttributes() {
		setHasImageLoadError( false );
		setAttributes( {
			src: undefined,
			id: undefined,
			url: undefined,
		} );
	}

	/**
	 * Runs an error callback if the image does not load.
	 * If the error callback is triggered, we infer that that image
	 * has been deleted.
	 *
	 * @param {boolean} isReplaced Whether the image has been replaced.
	 */
	function onImageError( isReplaced = false ) {
		// If the image block was not replaced with an embed,
		// and it's not an external image,
		// and it's been deleted from the database,
		// clear the attributes and trigger an error placeholder.
		if ( id && ! isReplaced && ! isExternalImage( id, url ) ) {
			isMediaFileDeleted( id ).then( ( isFileDeleted ) => {
				if ( isFileDeleted ) {
					noticeOperations.removeAllNotices();
					setHasImageLoadError( true );
				}
			} );
		}
	}

	function onUploadError( message ) {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
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
		if ( captionRef.current && ! get( mediaAttributes, [ 'caption' ] ) ) {
			mediaAttributes = omit( mediaAttributes, [ 'caption' ] );
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
			// Keep the same url when selecting the same file, so "Image Size"
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

	const classes = classnames( className, {
		'is-transient': temporaryURL,
		'is-resized': !! width || !! height,
		[ `size-${ sizeSlug }` ]: sizeSlug,
	} );

	const blockProps = useBlockProps( {
		ref,
		className: classes,
	} );

	return (
		<figure { ...blockProps }>
			{ hasImageLoadError && (
				<ImageErrorPlaceholder
					id={ id }
					url={ url }
					onClear={ clearImageAttributes }
					onSelect={ onSelectImage }
					onSelectURL={ onSelectURL }
					onUploadError={ onUploadError }
					onCloseModal={ onCloseModal }
				/>
			) }
			{ ! hasImageLoadError && ( temporaryURL || url ) && (
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
					onCloseModal={ onCloseModal }
					onImageLoadError={ onImageError }
				/>
			) }
			{ ! url && (
				<BlockControls group="block">
					<BlockAlignmentControl
						value={ align }
						onChange={ updateAlignment }
					/>
				</BlockControls>
			) }
			{ ! hasImageLoadError && (
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					onSelect={ onSelectImage }
					onSelectURL={ onSelectURL }
					notices={ noticeUI }
					onError={ onUploadError }
					onClose={ onCloseModal }
					accept="image/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ { id, src } }
					mediaPreview={ mediaPreview }
					disableMediaButtons={ temporaryURL || url }
				/>
			) }
		</figure>
	);
}

export default withNotices( ImageEdit );
