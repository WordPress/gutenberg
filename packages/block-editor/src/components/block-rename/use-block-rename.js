/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Return details about the block renaming status.
 *
 * @param {string} clientId The block client Id.
 *
 * @return {Object} Block renaming status
 */
export default function useBlockRename( clientId ) {
	return useSelect(
		( select ) => {
			const { getBlockName } = select( blockEditorStore );
			const { hasBlockSupport } = select( blocksStore );

			return {
				canRename: hasBlockSupport(
					getBlockName( clientId ),
					'renaming',
					true
				),
			};
		},
		[ clientId ]
	);
}
