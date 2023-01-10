/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
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
			const blockType = getBlockType( block.name );

			if (
				Object.keys( blockType?.providesContext ?? {} ).length === 0
			) {
				return undefined;
			}

			return mapValues(
				blockType.providesContext,
				( attributeName ) => block.attributes[ attributeName ]
			);
		},
		[ clientId ]
	);
}
