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

function NoteMenuItem( { clientId, onClick, isDistractionFree } ) {
	const { blockName, isValid, shortcut } = useSelect(
		( select ) => {
			const { getBlockName, isBlockValid } = select( blockEditorStore );
			return {
				blockName: getBlockName( clientId ),
				isValid: isBlockValid( clientId ),
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation( 'core/editor/new-note' ),
			};
		},
		[ clientId ]
	);

	if ( ! isValid || blockName === getUnregisteredTypeHandlerName() ) {
		return null;
	}

	const isDisabled = isDistractionFree || blockName === 'core/freeform';

	let infoText;

	if ( isDistractionFree ) {
		infoText = __( 'Notes are disabled in distraction free mode.' );
	} else if ( blockName === 'core/freeform' ) {
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
			{ ( { clientId, onClose } ) => (
				<NoteMenuItem
					clientId={ clientId }
					isDistractionFree={ isDistractionFree }
					onClick={ () => {
						onClick( clientId );
						onClose();
					} }
				/>
			) }
		</NoteIconSlotFill.Fill>
	);
}
