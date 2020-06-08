/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { displayShortcut } from '@wordpress/keycodes';
import { undo as undoIcon } from '@wordpress/icons';
import { forwardRef } from '@wordpress/element';

function EditorHistoryUndo( { hasUndo, undo, innerRef, ...props } ) {
	return (
		<Button
			{ ...props }
			ref={ innerRef }
			icon={ undoIcon }
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

const EnhancedEditorHistoryUndo = compose( [
	withSelect( ( select ) => ( {
		hasUndo: select( 'core/editor' ).hasEditorUndo(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		undo: dispatch( 'core/editor' ).undo,
	} ) ),
] )( EditorHistoryUndo );

export default forwardRef( ( props, ref ) => (
	<EnhancedEditorHistoryUndo { ...props } innerRef={ ref } />
) );
