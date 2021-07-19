/**
 * External dependencies
 */
import { every } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function useShortCodeTransform( shortCodeTransforms ) {
	const newImageData = useSelect(
		( select ) => {
			if ( ! shortCodeTransforms || shortCodeTransforms.length === 0 ) {
				return;
			}
			const getMedia = select( coreStore ).getMedia;
			return shortCodeTransforms.map( ( image ) => {
				const imageData = getMedia( image.id );
				if ( imageData ) {
					return {
						id: imageData.id,
						type: 'image',
						url: imageData.source_url,
						mime: imageData.mime_type,
						alt: imageData.alt_text,
						link: imageData.link,
					};
				}
				return undefined;
			} );
		},
		[ shortCodeTransforms ]
	);

	if ( ! newImageData ) {
		return;
	}

	if ( every( newImageData, ( img ) => img && img.url ) ) {
		return newImageData;
	}
}
