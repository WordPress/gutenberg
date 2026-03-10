/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Hook to determine if link status validation should be enabled.
 *
 * Link status validation is enabled when the root Navigation block is selected
 * or any of its inner blocks are selected. This ensures validation only runs
 * when the user is actively working within the navigation structure.
 *
 * @param {string} clientId The client ID of the current block.
 * @return {boolean} Whether link status validation should be enabled.
 */
export function useEnableLinkStatusValidation( clientId ) {
	return useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				hasSelectedInnerBlock,
				getBlockParentsByBlockName,
			} = select( blockEditorStore );

			const selectedBlockId = getSelectedBlockClientId();
			const rootNavigationId = getBlockParentsByBlockName(
				clientId,
				'core/navigation'
			)[ 0 ];

			// Enable when the root Navigation block is selected or any of its inner blocks.
			return (
				selectedBlockId === rootNavigationId ||
				hasSelectedInnerBlock( rootNavigationId, true )
			);
		},
		[ clientId ]
	);
}
