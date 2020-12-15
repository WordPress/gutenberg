/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockType, getBlockVariations } from '@wordpress/blocks';

/** @typedef {import('@wordpress/blocks').WPBlockDisplayInformation} WPBlockDisplayInformation */

/**
 * Hook used to try to find a matching block variation and return
 * the appropriate information for display reasons. In order to
 * to try to find a match we need to things:
 * 1. Block's client id to extract it's current attributes.
 * 2. A block variation should have set `isActive` prop to a proper function.
 *
 * If for any reason a block variaton match cannot be found,
 * the returned information come from the Block Type.
 *
 * @param {string} clientId Block's client id.
 * @return {WPBlockDisplayInformation} Block's display information.
 *
 */

// TODO write jsdoc example
// TODO write tests
export default function useMatchingVariationInformation( clientId ) {
	const { name, attributes } = useSelect(
		( select ) => {
			if ( ! clientId ) return {};
			const { getBlockName, getBlockAttributes } = select(
				'core/block-editor'
			);
			return {
				name: getBlockName( clientId ),
				attributes: getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);
	const blockType = getBlockType( name );
	if ( ! blockType ) return null;

	const blockTypeInfo = {
		title: blockType.title,
		icon: blockType.icon,
		description: blockType.description,
	};
	const variations = getBlockVariations( name );
	if ( ! variations ) return blockTypeInfo;
	const match = variations.find( ( variation ) =>
		variation.isActive?.( attributes )
	);
	if ( ! match ) return blockTypeInfo;
	return {
		title: match.title || blockType.title,
		icon: match.icon || blockType.icon,
		description: match.description || blockType.description,
	};
}
