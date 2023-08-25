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

function getImage( block ) {
	if ( block.name !== 'core/image' ) {
		return;
	}

	if ( block.attributes?.url ) {
		return {
			url: block.attributes.url,
			alt: block.attributes.alt,
			clientId: block.clientId,
		};
	}
}

function getImagesFromGallery( block ) {
	if ( block.name !== 'core/gallery' || ! block.innerBlocks ) {
		return [];
	}

	const images = [];

	for ( const innerBlock of block.innerBlocks ) {
		const img = getImage( innerBlock );
		if ( img ) {
			images.push( img );
		}
		if ( images.length >= MAX_IMAGES ) {
			return images;
		}
	}

	return images;
}

function getImagesFromBlock( block, isExpanded ) {
	const img = getImage( block );
	if ( img ) {
		return [ img ];
	}
	return isExpanded ? [] : getImagesFromGallery( block );
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
			const _block = select( blockEditorStore ).getBlock( clientId );
			return { block: _block };
		},
		[ clientId ]
	);

	const images = useMemo( () => {
		return getImagesFromBlock( block, isExpanded );
	}, [ block, isExpanded ] );

	return images;
}
