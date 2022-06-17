/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Returns the custom class name if the block is a light block.
 *
 * @param {string} clientId The block client ID.
 *
 * @return {string} The custom class name.
 */
export function useBlockCustomClassName( clientId ) {
	// It's good for this to be a separate selector because it will be executed
	// on every attribute change, while the other selectors are not re-evaluated
	// as much.
	return useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );

			if ( ! attributes?.className ) {
				return;
			}

			const blockType = getBlockType( getBlockName( clientId ) );
			const hasLightBlockWrapper = blockType?.apiVersion > 1;

			if ( ! hasLightBlockWrapper ) {
				return;
			}

			return attributes.className;
		},
		[ clientId ]
	);
}
