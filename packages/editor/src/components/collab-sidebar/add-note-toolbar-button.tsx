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
	clientIds: string[];
	count: number;
	onClick: () => void;
};

function NoteToolbarButton( {
	clientIds,
	count,
	onClick,
}: NoteToolbarButtonProps ) {
	const { canAddNote, shortcut } = useSelect(
		( select ) => {
			const { getBlockName, isBlockValid } = select( blockEditorStore );
			return {
				canAddNote: clientIds.every( ( clientId: string ) => {
					const blockName = getBlockName( clientId );
					return (
						isBlockValid( clientId ) &&
						blockName !== 'core/freeform' &&
						blockName !== getUnregisteredTypeHandlerName()
					);
				} ),
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation( 'core/editor/new-note' ),
			};
		},
		[ clientIds ]
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
							// translators: %d: Number of notes on the selected blocks.
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
	 * Number of notes on the selected blocks.
	 */
	count: number;

	/**
	 * Called with the selected blocks' client IDs to start a new note.
	 */
	onClick: ( clientIds: string[] ) => void;
};

export function AddNoteToolbarButton( {
	count,
	onClick,
}: AddNoteToolbarButtonProps ) {
	return (
		<NoteIconToolbarSlotFill.Fill>
			{ ( { clientIds }: { clientIds: string[] } ) =>
				clientIds.length > 0 && (
					<NoteToolbarButton
						clientIds={ clientIds }
						count={ count }
						onClick={ () => onClick( clientIds ) }
					/>
				)
			}
		</NoteIconToolbarSlotFill.Fill>
	);
}
