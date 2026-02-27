/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function BlockVisibilityViewportMenuItem( { clientIds } ) {
	const { areBlocksHiddenAnywhere, shortcut } = useSelect(
		( select ) => {
			const { isBlockHiddenAnywhere } = unlock(
				select( blockEditorStore )
			);
			return {
				areBlocksHiddenAnywhere: clientIds?.every( ( clientId ) =>
					isBlockHiddenAnywhere( clientId )
				),
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation(
					'core/block-editor/toggle-block-visibility'
				),
			};
		},
		[ clientIds ]
	);
	const { showViewportModal } = unlock( useDispatch( blockEditorStore ) );
	return (
		<MenuItem
			onClick={ () => showViewportModal( clientIds ) }
			shortcut={ shortcut }
		>
			{ areBlocksHiddenAnywhere ? __( 'Show' ) : __( 'Hide' ) }
		</MenuItem>
	);
}
