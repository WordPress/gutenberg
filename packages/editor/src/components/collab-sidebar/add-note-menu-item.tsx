/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { privateApis as blockEditorPrivateApis, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { NoteIconSlotFill } = unlock( blockEditorPrivateApis );

function NoteMenuItem( {
	clientId,
	onClick,
	isDistractionFree,
}: {
	clientId?: string;
	onClick?: () => void;
	isDistractionFree?: boolean;
} ) {
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
			shortcut={ shortcut ?? undefined }
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
}

/**
 * "Add note" item for a multi-block selection. The single-block variant keys off
 * one block's validity; a cross-block selection has none, so this is a plain item
 * that opens the form for the whole range. It shows the same new-note shortcut,
 * which also targets the selection when several blocks are selected.
 *
 * @param props
 * @param props.onClick           Opens the new-note form for the selection.
 * @param props.isDistractionFree Whether distraction-free mode is on.
 * @return The menu item.
 */
function SelectionNoteMenuItem( {
	onClick,
	isDistractionFree,
}: {
	onClick?: () => void;
	isDistractionFree?: boolean;
} ) {
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/editor/new-note'
			),
		[]
	);

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
			shortcut={ shortcut ?? undefined }
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
}

export function AddNoteMenuItem( {
	onClick,
	onClickSelection,
	isDistractionFree,
}: {
	onClick?: ( clientId: string ) => void;
	onClickSelection?: () => void;
	isDistractionFree?: boolean;
} ) {
	return (
		<NoteIconSlotFill.Fill>
			{ ( {
				clientId,
				count,
				onClose,
			}: {
				clientId: string;
				count: number;
				onClose: () => void;
			} ) =>
				count > 1 ? (
					<SelectionNoteMenuItem
						isDistractionFree={ isDistractionFree }
						onClick={ () => {
							onClickSelection?.();
							onClose();
						} }
					/>
				) : (
					<NoteMenuItem
						clientId={ clientId }
						isDistractionFree={ isDistractionFree }
						onClick={ () => {
							onClick?.( clientId );
							onClose();
						} }
					/>
				)
			}
		</NoteIconSlotFill.Fill>
	);
}
