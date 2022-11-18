/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { pipe } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useBlockSettingsContext, noop } from './block-settings-dropdown';

export function RemoveMenuItem( { onClose } ) {
	const {
		onRemove,
		canRemove,
		blockClientIds,
		__experimentalSelectBlock,
		previousBlockClientId,
		nextBlockClientId,
		selectedBlockClientIds,
	} = useBlockSettingsContext();

	const { remove } = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
			remove: getShortcutRepresentation( 'core/block-editor/remove' ),
		};
	}, [] );

	const firstBlockClientId = blockClientIds[ 0 ];

	const blockTitle = useBlockDisplayTitle( {
		clientId: firstBlockClientId,
		maximumLength: 25,
	} );

	const label = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		blockTitle
	);
	const removeBlockLabel =
		blockClientIds?.length === 1 ? label : __( 'Remove blocks' );

	const updateSelectionAfterRemove = useCallback(
		__experimentalSelectBlock
			? () => {
					const blockToSelect =
						previousBlockClientId || nextBlockClientId;

					if (
						blockToSelect &&
						// From the block options dropdown, it's possible to remove a block that is not selected,
						// in this case, it's not necessary to update the selection since the selected block wasn't removed.
						selectedBlockClientIds.includes( firstBlockClientId ) &&
						// Don't update selection when next/prev block also is in the selection ( and gets removed ),
						// In case someone selects all blocks and removes them at once.
						! selectedBlockClientIds.includes( blockToSelect )
					) {
						__experimentalSelectBlock( blockToSelect );
					}
			  }
			: noop,
		[
			__experimentalSelectBlock,
			previousBlockClientId,
			nextBlockClientId,
			selectedBlockClientIds,
			firstBlockClientId,
		]
	);

	if ( ! canRemove ) {
		return null;
	}

	return (
		<MenuGroup>
			<MenuItem
				onClick={ pipe(
					onClose,
					onRemove,
					updateSelectionAfterRemove
				) }
				shortcut={ remove }
			>
				{ removeBlockLabel }
			</MenuItem>
		</MenuGroup>
	);
}
