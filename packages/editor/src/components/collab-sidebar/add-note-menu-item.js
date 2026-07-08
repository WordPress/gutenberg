/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { NoteIconSlotFill } = unlock( blockEditorPrivateApis );

function NoteMenuItem( { clientId, onClick, isDistractionFree } ) {
	const block = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/editor/new-note'
			),
		[]
	);

	if (
		! block?.isValid ||
		block?.name === getUnregisteredTypeHandlerName()
	) {
		return null;
	}

	const isDisabled = isDistractionFree || block?.name === 'core/freeform';

	let infoText;

	if ( isDistractionFree ) {
		infoText = __( 'Notes are disabled in distraction free mode.' );
	} else if ( block?.name === 'core/freeform' ) {
		infoText = __( 'Convert to blocks to add notes.' );
	}

	return (
		<MenuItem
			onClick={ onClick }
			aria-haspopup="dialog"
			disabled={ isDisabled }
			info={ infoText }
			shortcut={ shortcut }
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
}

/**
 * "Add note" item for a multi-block selection. The single-block variant keys off
 * one block's validity and shows the new-note shortcut; a cross-block selection
 * has neither, so this is a plain item that opens the form for the whole range.
 *
 * @param {Object}   props
 * @param {Function} props.onClick           Opens the new-note form for the selection.
 * @param {boolean}  props.isDistractionFree Whether distraction-free mode is on.
 * @return {Element} The menu item.
 */
function SelectionNoteMenuItem( { onClick, isDistractionFree } ) {
	return (
		<MenuItem
			onClick={ onClick }
			aria-haspopup="dialog"
			disabled={ isDistractionFree }
			info={
				isDistractionFree
					? __( 'Notes are disabled in distraction free mode.' )
					: undefined
			}
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
}

export function AddNoteMenuItem( {
	onClick,
	onClickSelection,
	isDistractionFree,
} ) {
	return (
		<NoteIconSlotFill.Fill>
			{ ( { clientId, count, onClose } ) =>
				count > 1 ? (
					<SelectionNoteMenuItem
						isDistractionFree={ isDistractionFree }
						onClick={ () => {
							onClickSelection();
							onClose();
						} }
					/>
				) : (
					<NoteMenuItem
						clientId={ clientId }
						isDistractionFree={ isDistractionFree }
						onClick={ () => {
							onClick( clientId );
							onClose();
						} }
					/>
				)
			}
		</NoteIconSlotFill.Fill>
	);
}
