import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { privateApis as blockEditorPrivateApis, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
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
 * one block's validity; this applies the same rules across the whole selection,
 * since a note anchors to every block the selection spans. It shows the same
 * new-note shortcut, which also targets the selection when several blocks are
 * selected.
 *
 * @param props
 * @param props.onClick           Opens the new-note form for the selection.
 * @param props.isDistractionFree Whether distraction-free mode is on.
 * @return The menu item, or null when no block in the selection can carry one.
 */
function SelectionNoteMenuItem( {
	onClick,
	isDistractionFree,
}: {
	onClick?: () => void;
	isDistractionFree?: boolean;
} ) {
	const { hasUnsupportedBlock, hasClassicBlock } = useSelect( ( select ) => {
		const { getMultiSelectedBlockClientIds, getBlockName, isBlockValid } =
			select( blockEditorStore );
		const clientIds: string[] = getMultiSelectedBlockClientIds();
		return {
			hasUnsupportedBlock: clientIds.some(
				( id ) =>
					! isBlockValid( id ) ||
					getBlockName( id ) === getUnregisteredTypeHandlerName()
			),
			hasClassicBlock: clientIds.some(
				( id ) => getBlockName( id ) === 'core/freeform'
			),
		};
	}, [] );
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/editor/new-note'
			),
		[]
	);

	// An invalid or unregistered block in the range can't carry an anchor, and
	// the note would span it silently; hide the entry as the single-block
	// variant does.
	if ( hasUnsupportedBlock ) {
		return null;
	}

	let infoText;

	if ( isDistractionFree ) {
		infoText = __( 'Notes are disabled in distraction free mode.' );
	} else if ( hasClassicBlock ) {
		infoText = __( 'Convert to blocks to add notes.' );
	}

	return (
		<MenuItem
			onClick={ onClick }
			aria-haspopup="dialog"
			disabled={ isDistractionFree || hasClassicBlock }
			info={ infoText }
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
