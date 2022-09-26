/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockType, getBlockDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Returns the default class name if the block is a light block and it supports
 * `className`.
 *
 * @param {string} clientId The block client ID.
 *
 * @return {string} The class name, e.g. `wp-block-paragraph`.
 */
export function useBlockDefaultClassName( clientId ) {
	return useSelect(
		( select ) => {
			const name = select( blockEditorStore ).getBlockName( clientId );
			const blockType = getBlockType( name );
			const hasLightBlockWrapper = blockType?.apiVersion > 1;

			if ( ! hasLightBlockWrapper ) {
				return;
			}

			return getBlockDefaultClassName( name );
		},
		[ clientId ]
	);
}
