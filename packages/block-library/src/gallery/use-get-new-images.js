/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Keeps track of images already in the gallery to allow new innerBlocks to be identified. This
 * is required so default gallery attributes can be applied without overwriting any custom
 * attributes applied to existing images.
 *
 * @param {Array} images    Basic image block data taken from current gallery innerBlock
 * @param {Array} imageData The related image data for each of the current gallery images.
 *
 * @return {Array} An array of any new images that have been added to the gallery.
 */
export default function useGetNewImages( images, imageData ) {
	const [ currentImages, setCurrentImages ] = useState( [] );

	return useMemo( () => getNewImages(), [ images, imageData ] );

	function getNewImages() {
		let imagesUpdated = false;

		// First lets check if any images have been deleted.
		const newCurrentImages = currentImages.filter( ( currentImg ) =>
			images.find( ( img ) => {
				return currentImg.clientId === img.clientId;
			} )
		);

		if ( newCurrentImages.length < currentImages.length ) {
			imagesUpdated = true;
		}

		// Now lets see if we have any images hydrated from saved content and if so
		// add them to currentImages state.
		images.forEach( ( image ) => {
			if (
				image.fromSavedContent &&
				! newCurrentImages.find(
					( currentImage ) => currentImage.id === image.id
				)
			) {
				imagesUpdated = true;
				newCurrentImages.push( image );
			}
		} );

		// Now check for any new images that have been added to InnerBlocks and for which
		// we have the imageData we need for setting default block attributes.
		const newImages = images.filter(
			( image ) =>
				! newCurrentImages.find(
					( currentImage ) =>
						image.clientId &&
						currentImage.clientId === image.clientId
				) &&
				imageData?.find( ( img ) => img.id === image.id ) &&
				! image.fromSavedConent
		);

		if ( imagesUpdated || newImages?.length > 0 ) {
			setCurrentImages( [ ...newCurrentImages, ...newImages ] );
		}

		return newImages.length > 0 ? newImages : null;
	}
}
