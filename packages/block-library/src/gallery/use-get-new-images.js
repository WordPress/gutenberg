/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

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
					( currentImage ) => image.id && currentImage.id === image.id
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
