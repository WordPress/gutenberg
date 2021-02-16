/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blocksStore,
	__experimentalGetBlockLabel as getBlockLabel,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/** @typedef {import('@wordpress/blocks').WPIcon} WPIcon */

/**
 * Contains basic block's information for display reasons.
 *
 * @typedef {Object} WPBlockDisplayInformation
 *
 * @property {string} title Human-readable block type label.
 * @property {WPIcon} icon Block type icon.
 * @property {string} description A detailed block type description.
 */

/**
 * Hook used to return appropriate information for display reasons.
 * It takes variations and custom `label` function into account.
 *
 * In order to try to find a variation match we need two things:
 * 1. Block's client id to extract its current attributes.
 * 2. A block variation should have set `isActive` prop to a proper function.
 *
 * Value from custom `label` function is prioritized, if that's not found
 * then the block variation' information is returned. If both are missing
 * then the information is returned from the Block Type.
 *
 * If no `blockType` is found with the provided `clientId`, returns `null`.
 *
 * @param {string} clientId Block's client id.
 * @return {?WPBlockDisplayInformation} Block's display information, or `null` when the block or its type not found.
 */
export default function useBlockDisplayInformation( clientId ) {
	return useSelect(
		( select ) => {
			if ( ! clientId ) return null;

			const { getBlockName, getBlockAttributes } = select(
				blockEditorStore
			);
			const { getBlockType, getBlockVariations } = select( blocksStore );

			const blockName = getBlockName( clientId );
			const blockType = getBlockType( blockName );
			if ( ! blockType ) return null;

			const variations = getBlockVariations( blockName );
			const attributes = getBlockAttributes( clientId );

			const dynamicTitle = getBlockLabel( blockType, attributes );
			const variationInfo = getVariationInfo( variations, attributes );

			const title =
				dynamicTitle && dynamicTitle !== blockType.title
					? dynamicTitle
					: variationInfo.title || blockType.title;
			const icon = variationInfo.icon || blockType.icon;
			const description =
				variationInfo.description || blockType.description;

			return {
				title,
				icon,
				description,
			};
		},
		[ clientId ]
	);
}

function getVariationInfo( variations, attributes ) {
	const emptyInfo = { title: null, icon: null, description: null };
	if ( ! variations?.length ) {
		return emptyInfo;
	}

	const match = variations.find( ( variation ) =>
		variation.isActive?.( attributes, variation.attributes )
	);
	return match || emptyInfo;
}
