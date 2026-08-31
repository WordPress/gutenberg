import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	// @ts-expect-error `@wordpress/block-editor` has no type declarations.
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

type NoteToolbarButtonProps = {
	clientId: string;
	isOpen: boolean;
	onClick: () => void;
};

function NoteToolbarButton( {
	clientId,
	isOpen,
	onClick,
}: NoteToolbarButtonProps ) {
	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
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

	const isDisabled = block?.name === 'core/freeform';
	const label = isDisabled
		? __( 'Convert to blocks to add notes.' )
		: __( 'Add note' );

	return (
		<ToolbarButton
			className="editor-add-note-toolbar-button"
			icon={ commentIcon }
			label={ label }
			onClick={ onClick }
			aria-haspopup="dialog"
			aria-expanded={ isOpen }
			isPressed={ isOpen }
			disabled={ isDisabled }
			shortcut={ shortcut ?? undefined }
			showTooltip
		/>
	);
}

type AddNoteToolbarButtonProps = {
	clientId: string;
	isOpen: boolean;
	onClick: ( clientId: string ) => void;
};

export function AddNoteToolbarButton( {
	clientId,
	isOpen,
	onClick,
}: AddNoteToolbarButtonProps ) {
	return (
		<NoteIconToolbarSlotFill.Fill>
			<NoteToolbarButton
				clientId={ clientId }
				isOpen={ isOpen }
				onClick={ () => onClick( clientId ) }
			/>
		</NoteIconToolbarSlotFill.Fill>
	);
}
