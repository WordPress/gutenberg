/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Retrieves the extended media info for each gallery image from the store. This is used to
 * determine which image size options are available for the current gallery.
 *
 * @param {Array} innerBlockImages An array of the innerBlock images currently in the gallery.
 *
 * @return {Array} An array of media info options for each gallery image.
 */
export default function useGetMedia( innerBlockImages ) {
	const [ currentImageMedia, setCurrentImageMedia ] = useState( [] );

	const imageMedia = useSelect(
		( select ) => {
			if ( ! innerBlockImages?.length ) {
				return currentImageMedia;
			}

			const imageIds = innerBlockImages
				.map( ( imageBlock ) => imageBlock.attributes.id )
				.filter( ( id ) => id !== undefined );

			if ( imageIds.length === 0 ) {
				return currentImageMedia;
			}

			return select( coreStore ).getMediaItems( {
				include: imageIds.join( ',' ),
				per_page: -1,
			} );
		},
		[ innerBlockImages ]
	);

	if (
		imageMedia?.length !== currentImageMedia?.length ||
		imageMedia?.some(
			( newImage ) =>
				! currentImageMedia.find(
					( currentImage ) => currentImage.id === newImage.id
				)
		)
	) {
		setCurrentImageMedia( imageMedia );
		return imageMedia;
	}
	return currentImageMedia;
}
