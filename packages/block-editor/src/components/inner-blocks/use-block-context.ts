import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';

/**
 * Returns a context object for a given block.
 *
 * @param clientId The block client ID.
 *
 * @return Context value.
 */
export default function useBlockContext(
	clientId: string
): Record< string, unknown > | undefined {
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

			// Registration defaults `providesContext` to an empty object.
			if ( Object.keys( blockType.providesContext! ).length === 0 ) {
				return undefined;
			}

			return Object.fromEntries(
				Object.entries( blockType.providesContext! ).map(
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
