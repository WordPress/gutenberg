/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { getMediaRoleAttributes } = unlock( blocksPrivateApis );

// Maximum number of images to display in a list view row.
const MAX_IMAGES = 3;

function getImagesFromBlock( block, isExpanded ) {
	// Don't show images for expanded blocks (inner blocks shown separately).
	if ( isExpanded && block.innerBlocks?.length ) {
		return [];
	}
	const images = [];
	// First, try to get an image from the block itself.
	const blockImage = getImageFromMediaBlock( block );
	if ( blockImage ) {
		images.push( blockImage );
	}
	// Recursively check direct inner blocks.
	// TODO: this is intentional for the first draft as we might not even want to
	// support this for every block with child blocks. This covers the `gallery` block
	// but also adds the `image` info for other blocks, like a `Group` with an Image block.
	if ( block.innerBlocks?.length ) {
		for ( const innerBlock of block.innerBlocks ) {
			const innerImage = getImageFromMediaBlock( innerBlock );
			if ( innerImage ) {
				images.push( innerImage );
			}
			if ( images.length >= MAX_IMAGES ) {
				break;
			}
		}
	}
	return images;
}

function getImageFromMediaBlock( block ) {
	const mediaAttributes = getMediaRoleAttributes(
		block.name,
		block.attributes
	);
	// Only show images in list view and only when there are media attributes and a url.
	if (
		! mediaAttributes ||
		mediaAttributes.type !== 'image' ||
		! mediaAttributes.url
	) {
		return null;
	}
	return {
		url: mediaAttributes.url,
		alt: mediaAttributes.alt || '',
		clientId: block.clientId,
	};
}

/**
 * Get a block's preview images for display within a list view row.
 *
 * Uses the `mediaRoles` block config to generically extract media information
 * from any block that defines media roles.
 *
 * @param {Object}  props            Hook properties.
 * @param {string}  props.clientId   The block's clientId.
 * @param {boolean} props.isExpanded Whether or not the block is expanded in the list view.
 * @return {Array} Images.
 */
export default function useListViewImages( { clientId, isExpanded } ) {
	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);
	const images = useMemo( () => {
		return getImagesFromBlock( block, isExpanded );
	}, [ block, isExpanded ] );

	return images;
}
