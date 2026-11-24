import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { unlock } from '../../lock-unlock';

const { NoteIconSlotFill } = unlock( blockEditorPrivateApis );

function NoteMenuItem( { clientIds, onClick, isDistractionFree } ) {
	const { isValid, isClassicBlock, shortcut } = useSelect(
		( select ) => {
			const { getBlockName, isBlockValid } = select( blockEditorStore );
			return {
				isValid: clientIds.every(
					( clientId ) =>
						isBlockValid( clientId ) &&
						getBlockName( clientId ) !==
							getUnregisteredTypeHandlerName()
				),
				isClassicBlock: clientIds.some(
					( clientId ) => getBlockName( clientId ) === 'core/freeform'
				),
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation( 'core/editor/new-note' ),
			};
		},
		[ clientIds ]
	);

	if ( ! isValid ) {
		return null;
	}

	const isDisabled = isDistractionFree || isClassicBlock;

	let infoText;

	if ( isDistractionFree ) {
		infoText = __( 'Notes are disabled in distraction free mode.' );
	} else if ( isClassicBlock ) {
		infoText = __( 'Convert to blocks to add notes.' );
	}

	return (
		<MenuItem
			onClick={ onClick }
			disabled={ isDisabled }
			info={ infoText }
			shortcut={ shortcut }
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
}

export function AddNoteMenuItem( { onClick, isDistractionFree } ) {
	return (
		<NoteIconSlotFill.Fill>
			{ ( { clientIds, onClose } ) => (
				<NoteMenuItem
					clientIds={ clientIds }
					isDistractionFree={ isDistractionFree }
					onClick={ () => {
						onClick( clientIds );
						onClose();
					} }
				/>
			) }
		</NoteIconSlotFill.Fill>
	);
}
