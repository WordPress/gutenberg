/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function useGetMedia( innerBlockImages ) {
	const [ currentImageMedia, setCurrentImageMedia ] = useState( [] );

	const imageMedia = useSelect(
		( select ) => {
			if (
				! innerBlockImages?.length ||
				some(
					innerBlockImages,
					( imageBlock ) => ! imageBlock.attributes.id
				)
			) {
				return currentImageMedia;
			}

			const imageIds = innerBlockImages.map(
				( imageBlock ) => imageBlock.attributes.id
			);

			if ( imageIds.length === 0 ) {
				return currentImageMedia;
			}
			const getMedia = select( coreStore ).getMedia;
			const newImageMedia = imageIds.map( ( img ) => {
				return getMedia( img );
			} );

			if ( newImageMedia.some( ( img ) => ! img ) ) {
				return currentImageMedia;
			}

			return newImageMedia;
		},
		[ innerBlockImages ]
	);

	if (
		imageMedia?.length !== currentImageMedia.length ||
		some(
			imageMedia,
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
