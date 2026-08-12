import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { ALLOWED_MEDIA_TYPES } from './constants';

function isValidFileType( file ) {
	const mediaTypeSelector = file.type;

	return (
		ALLOWED_MEDIA_TYPES.some(
			( mediaType ) => mediaTypeSelector?.indexOf( mediaType ) === 0
		) || file.blob
	);
}

/**
 * Returns a callback that merges a media selection (or a `FileList` from a
 * direct upload) into a gallery's inner image blocks.
 *
 * Everything it needs is derived from the gallery's client ID at call time, so
 * the "Add" control can be rendered either by the gallery itself or by a
 * selected child image block.
 *
 * The new blocks are created with only the attributes the media selection
 * carries. Gallery-wide attributes (`sizeSlug`, `linkTo`, `linkTarget`,
 * `aspectRatio`) are applied afterwards by the gallery's own hydration effect,
 * which runs whoever triggered the change.
 *
 * @param {string} clientId Client ID of the gallery block.
 *
 * @return {Function} `onSelect` handler for a media picker.
 */
export default function useUpdateImages( clientId ) {
	const { getBlock } = useSelect( blockEditorStore );
	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	return useCallback(
		( selectedImages ) => {
			const innerBlockImages = getBlock( clientId )?.innerBlocks ?? [];
			const newFileUploads =
				Object.prototype.toString.call( selectedImages ) ===
				'[object FileList]';

			const imageArray = newFileUploads
				? Array.from( selectedImages ).map( ( file ) => {
						if ( ! file.url ) {
							return {
								blob: createBlobURL( file ),
							};
						}

						return file;
				  } )
				: selectedImages;

			if ( ! imageArray.every( isValidFileType ) ) {
				createErrorNotice(
					__(
						'If uploading to a gallery all files need to be image formats'
					),
					{ id: 'gallery-upload-invalid-file', type: 'snackbar' }
				);
			}

			const processedImages = imageArray
				.filter( ( file ) => file.url || isValidFileType( file ) )
				.map( ( file ) => {
					if ( ! file.url ) {
						return {
							blob: file.blob || createBlobURL( file ),
						};
					}

					return file;
				} );

			// Because we are reusing existing innerImage blocks any reordering
			// done in the media library will be lost so we need to reapply that ordering
			// once the new image blocks are merged in with existing.
			const newOrderMap = processedImages.reduce(
				( result, image, index ) => (
					( result[ image.id ] = index ), result
				),
				{}
			);

			const existingImageBlocks = ! newFileUploads
				? innerBlockImages.filter( ( block ) =>
						processedImages.find(
							( img ) => img.id === block.attributes.id
						)
				  )
				: innerBlockImages;

			const newImageList = processedImages.filter(
				( img ) =>
					! existingImageBlocks.find(
						( existingImg ) => img.id === existingImg.attributes.id
					)
			);

			const newBlocks = newImageList.map( ( image ) => {
				return createBlock( 'core/image', {
					id: image.id,
					blob: image.blob,
					url: image.url,
					caption: image.caption,
					alt: image.alt,
				} );
			} );

			replaceInnerBlocks(
				clientId,
				existingImageBlocks
					.concat( newBlocks )
					.sort(
						( a, b ) =>
							newOrderMap[ a.attributes.id ] -
							newOrderMap[ b.attributes.id ]
					)
			);

			// Select the first block to scroll into view when new blocks are added.
			if ( newBlocks?.length > 0 ) {
				selectBlock( newBlocks[ 0 ].clientId );
			}
		},
		[
			clientId,
			getBlock,
			replaceInnerBlocks,
			selectBlock,
			createErrorNotice,
		]
	);
}
