import { ToolbarButton } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

type NoteToolbarButtonProps = {
	clientId: string;
	count: number;
	onClick: () => void;
};

function NoteToolbarButton( {
	clientId,
	count,
	onClick,
}: NoteToolbarButtonProps ) {
	const { canAddNote, shortcut } = useSelect(
		( select ) => {
			const { getBlockName, isBlockValid } = select( blockEditorStore );
			const blockName = getBlockName( clientId );
			return {
				canAddNote:
					isBlockValid( clientId ) &&
					blockName !== 'core/freeform' &&
					blockName !== getUnregisteredTypeHandlerName(),
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation( 'core/editor/new-note' ),
			};
		},
		[ clientId ]
	);

	if ( ! canAddNote ) {
		return null;
	}

	return (
		<ToolbarButton
			icon={ commentIcon }
			label={
				count
					? sprintf(
							// translators: %d: Number of notes on the block.
							_n(
								'Add note (%d note)',
								'Add note (%d notes)',
								count
							),
							count
						)
					: __( 'Add note' )
			}
			shortcut={ shortcut ?? undefined }
			onClick={ onClick }
		/>
	);
}

type AddNoteToolbarButtonProps = {
	/**
	 * Number of notes on the selected block.
	 */
	count: number;

	/**
	 * Called with the block's client ID to start a new note.
	 */
	onClick: ( clientId: string ) => void;
};

export function AddNoteToolbarButton( {
	count,
	onClick,
}: AddNoteToolbarButtonProps ) {
	return (
		<NoteIconToolbarSlotFill.Fill>
			{ ( { clientIds }: { clientIds: string[] } ) =>
				clientIds.length === 1 && (
					<NoteToolbarButton
						clientId={ clientIds[ 0 ] }
						count={ count }
						onClick={ () => onClick( clientIds[ 0 ] ) }
					/>
				)
			}
		</NoteIconToolbarSlotFill.Fill>
	);
}
