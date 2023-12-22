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
	const images = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlockImage( clientId ) || [];
		},
		[ clientId ]
	);
	const filteredImages = useMemo(
		() => images.slice( 0, MAX_IMAGES ),
		[ images ]
	);
	return isExpanded ? [] : filteredImages;
}
