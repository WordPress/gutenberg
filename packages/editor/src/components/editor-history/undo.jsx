import { __, isRTL } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { undo as undoIcon, redo as redoIcon } from '@wordpress/icons';
import { forwardRef } from '@wordpress/element';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function EditorHistoryUndo( props, ref ) {
	const hasUndo = useSelect( ( select ) => {
		/*
		 * Undo rewrites the post, so the read-only Viewing intent refuses it
		 * the same way it refuses a keystroke. `undo` in the editor store
		 * refuses it too — this only keeps the button from advertising an
		 * action it would decline. `isEditorIntentReadOnly` is private while
		 * Suggest mode is experimental.
		 */
		if ( unlock( select( editorStore ) ).isEditorIntentReadOnly() ) {
			return false;
		}
		return select( editorStore ).hasEditorUndo();
	}, [] );
	const { undo } = useDispatch( editorStore );
	return (
		<Button
			__next40pxDefaultSize
			{ ...props }
			ref={ ref }
			icon={ ! isRTL() ? undoIcon : redoIcon }
			/* translators: button label text should, if possible, be under 16 characters. */
			label={ __( 'Undo' ) }
			shortcut={ displayShortcut.primary( 'z' ) }
			// If there are no undo levels we don't want to actually disable this
			// button, because it will remove focus for keyboard users.
			// See: https://github.com/WordPress/gutenberg/issues/3486
			aria-disabled={ ! hasUndo }
			onClick={ hasUndo ? undo : undefined }
			className="editor-history__undo"
		/>
	);
}

/** @typedef {React.Ref<HTMLElement>} Ref */

/**
 * Renders the undo button for the editor history.
 *
 * @param {Object} props - Props.
 * @param {Ref}    ref   - Forwarded ref.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default forwardRef( EditorHistoryUndo );
