import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import BlockRenameModal from './modal';
import type { BlockRenameControlProps } from './types';

export default function BlockRenameControl( {
	clientId,
}: BlockRenameControlProps ) {
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
				// `MenuItem` renders no shortcut for `null`.
				shortcut={ shortcut as string | undefined }
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
