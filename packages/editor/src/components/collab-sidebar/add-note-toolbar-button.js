/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

function NoteToolbarButton( { clientId, onClick } ) {
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
			disabled={ isDisabled }
			shortcut={ shortcut }
			showTooltip
		/>
	);
}

export function AddNoteToolbarButton( { clientId, onClick } ) {
	return (
		<NoteIconToolbarSlotFill.Fill>
			<NoteToolbarButton
				clientId={ clientId }
				onClick={ () => onClick( clientId ) }
			/>
		</NoteIconToolbarSlotFill.Fill>
	);
}
