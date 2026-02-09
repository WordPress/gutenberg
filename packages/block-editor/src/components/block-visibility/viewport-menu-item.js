/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { BlockVisibilityModal } from './';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function BlockVisibilityViewportMenuItem( { clientIds } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
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
	return (
		<>
			<MenuItem
				onClick={ () => setIsModalOpen( true ) }
				shortcut={ shortcut }
			>
				{ areBlocksHiddenAnywhere ? __( 'Show' ) : __( 'Hide' ) }
			</MenuItem>
			{ isModalOpen && (
				<BlockVisibilityModal
					clientIds={ clientIds }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
