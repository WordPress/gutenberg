/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Returns a context object for a given block.
 *
 * @param {string} clientId The block client ID.
 *
 * @return {Record<string,*>} Context value.
 */
export default function useBlockContext( clientId ) {
	return useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			if ( ! block ) {
				return undefined;
			}

			const blockType = select( blocksStore ).getBlockType( block.name );
			if ( ! blockType ) {
				return undefined;
			}

			if ( Object.keys( blockType.providesContext ).length === 0 ) {
				return undefined;
			}

			return Object.fromEntries(
				Object.entries( blockType.providesContext ).map(
					( [ contextName, attributeName ] ) => [
						contextName,
						block.attributes[ attributeName ],
					]
				)
			);
		},
		[ clientId ]
	);
}
