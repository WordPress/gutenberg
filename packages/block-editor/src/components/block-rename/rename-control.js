/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import BlockRenameModal from './modal';

export default function BlockRenameControl( { clientId } ) {
	const [ renamingBlock, setRenamingBlock ] = useState( false );

	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/block-editor/rename'
			),
		[]
	);

	return (
		<>
			<MenuItem
				onClick={ () => {
					setRenamingBlock( true );
				} }
				aria-expanded={ renamingBlock }
				aria-haspopup="dialog"
				shortcut={ shortcut }
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ renamingBlock && (
				<BlockRenameModal
					clientId={ clientId }
					onClose={ () => setRenamingBlock( false ) }
				/>
			) }
		</>
	);
}
