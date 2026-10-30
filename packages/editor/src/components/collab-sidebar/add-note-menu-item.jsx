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
import { isCrossBlockTextSelection } from './utils';

const { NoteIconSlotFill } = unlock( blockEditorPrivateApis );

function NoteMenuItem( { clientId, isMultiple, onClick, isDistractionFree } ) {
	const { blockName, isValid, isTextAcrossBlocks, shortcut } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getSelectionEnd,
				getSelectionStart,
				isBlockValid,
			} = select( blockEditorStore );
			return {
				blockName: getBlockName( clientId ),
				isValid: isBlockValid( clientId ),
				isTextAcrossBlocks: isCrossBlockTextSelection(
					getSelectionStart(),
					getSelectionEnd()
				),
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation( 'core/editor/new-note' ),
			};
		},
		[ clientId ]
	);

	// Several blocks share a note only through text selected across them.
	if (
		! isValid ||
		blockName === getUnregisteredTypeHandlerName() ||
		( isMultiple && ! isTextAcrossBlocks )
	) {
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
			{ ( { clientId, clientIds, onClose } ) => (
				<NoteMenuItem
					clientId={ clientId }
					isMultiple={ clientIds?.length > 1 }
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
