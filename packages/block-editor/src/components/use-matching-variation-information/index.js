/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/** @typedef {import('@wordpress/blocks').WPBlockDisplayInformation} WPBlockDisplayInformation */

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
 * @return {WPBlockDisplayInformation} Block's display information.
 *
 */

// TODO write jsdoc example
// TODO write tests
export default function useMatchingVariationInformation( clientId ) {
	return useSelect(
		( select ) => {
			if ( ! clientId ) return null;
			const { getBlockName, getBlockAttributes } = select(
				'core/block-editor'
			);
			const { getBlockDisplayInformation } = select( 'core/blocks' );
			const attributes = getBlockAttributes( clientId );
			const name = getBlockName( clientId );
			return (
				name &&
				attributes &&
				getBlockDisplayInformation( name, attributes )
			);
		},
		[ clientId ]
	);
}
