/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

// Maximum number of images to display in a list view row.
const MAX_IMAGES = 3;
const IMAGE_GETTERS = {
	'core/image': ( { clientId, attributes } ) => {
		if ( attributes.url ) {
			return {
				url: attributes.url,
				alt: attributes.alt || '',
				clientId,
			};
		}
	},
	'core/cover': ( { clientId, attributes } ) => {
		if ( attributes.backgroundType === 'image' && attributes.url ) {
			return {
				url: attributes.url,
				alt: attributes.alt || '',
				clientId,
			};
		}
	},
	'core/media-text': ( { clientId, attributes } ) => {
		if ( attributes.mediaType === 'image' && attributes.mediaUrl ) {
			return {
				url: attributes.mediaUrl,
				alt: attributes.mediaAlt || '',
				clientId,
			};
		}
	},
	'core/gallery': ( { innerBlocks } ) => {
		const images = [];
		const getValues = !! innerBlocks?.length
			? IMAGE_GETTERS[ innerBlocks[ 0 ].name ]
			: undefined;
		if ( ! getValues ) {
			return images;
		}

		for ( const innerBlock of innerBlocks ) {
			const img = getValues( innerBlock );
			if ( img ) {
				images.push( img );
			}
			if ( images.length >= MAX_IMAGES ) {
				return images;
			}
		}

		return images;
	},
};

function getImagesFromBlock( block, isExpanded ) {
	const getImages = IMAGE_GETTERS[ block.name ];
	const images = !! getImages ? getImages( block ) : undefined;

	if ( ! images ) {
		return [];
	}

	if ( ! Array.isArray( images ) ) {
		return [ images ];
	}

	return isExpanded ? [] : images;
}

/**
 * Get a block's preview images for display within a list view row.
 *
 * TODO: Currently only supports images from the core/image and core/gallery
 * blocks. This should be expanded to support other blocks that have images,
 * potentially via an API that blocks can opt into / provide their own logic.
 *
 * @param {Object}  props            Hook properties.
 * @param {string}  props.clientId   The block's clientId.
 * @param {boolean} props.isExpanded Whether or not the block is expanded in the list view.
 * @return {Array} Images.
 */
export default function useListViewImages( { clientId, isExpanded } ) {
	const { block } = useSelect(
		( select ) => {
			return { block: select( blockEditorStore ).getBlock( clientId ) };
		},
		[ clientId ]
	);
	const images = useMemo( () => {
		return getImagesFromBlock( block, isExpanded );
	}, [ block, isExpanded ] );

	return images;
}
