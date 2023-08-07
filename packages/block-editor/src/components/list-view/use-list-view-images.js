/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function getImageUrl( block ) {
	if ( block.name !== 'core/image' ) {
		return;
	}

	if ( block.attributes.url ) {
		return { url: block.attributes.url, alt: block.attributes.alt };
	}
}

function getImagesFromGallery( block ) {
	if ( block.name !== 'core/gallery' || ! block.innerBlocks ) {
		return [];
	}
	return block.innerBlocks.reduce( ( images, innerBlock ) => {
		if ( innerBlock.name !== 'core/image' ) {
			return images;
		}
		const img = getImageUrl( innerBlock );
		if ( img ) {
			return [ ...images, img ];
		}
		return images;
	}, [] );
}

function getImagesFromBlock( block, isExpanded ) {
	const img = getImageUrl( block );
	if ( img ) {
		return [ img ];
	}
	return isExpanded ? [] : getImagesFromGallery( block );
}

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
