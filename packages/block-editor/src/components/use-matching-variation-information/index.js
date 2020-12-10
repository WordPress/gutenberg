/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * @typedef {Object} BlockDisplayInformation Contains block's information for display reasons.
 * @property {string} title Block's title or block variation match's title, if found.
 * @property {JSX.Element} icon Block's icon or block variation match's icon, if found.
 * @property {string} description Block's description or block variation match's description, if found.
 */

/**
 * Hook used to try to find a matching block variation and return
 * the appropriate information for display reasons. In order to
 * to try to find a match we need to things:
 * 1. Block's client id to extract it's current attributes.
 * 2. Block should have in it's settings a `variationMatcher` function.
 *
 * If for any reason a block variaton match cannot be found,
 * the returned information come from the Block Type.
 *
 * @param {string} clientId Block's client id.
 * @return {BlockDisplayInformation} Block's display information.
 *
 */

// TODO write jsdoc example
// TODO write tests
export default function useMatchingVariationInformation( clientId ) {
	const { attributes, name } = useSelect(
		( select ) => {
			if ( ! clientId ) return {};
			const { getBlockName, getBlockAttributes } = select(
				'core/block-editor'
			);
			return {
				attributes: getBlockAttributes( clientId ),
				name: getBlockName( clientId ),
			};
		},
		[ clientId ]
	);
	const displayInformation = useSelect(
		( select ) => {
			if ( ! ( name && attributes ) ) return null;
			const { getBlockDisplayInformation } = select( 'core/blocks' );
			return getBlockDisplayInformation( name, attributes );
		},
		[ name, attributes ]
	);
	return displayInformation;
}
