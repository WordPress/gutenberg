/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { displayShortcut } from '@wordpress/keycodes';

function EditorHistoryRedo( { hasRedo, redo } ) {
	return (
		<IconButton
			icon="redo"
			label={ __( 'Redo' ) }
			shortcut={ displayShortcut.primaryShift( 'z' ) }
			aria-disabled={ ! hasRedo }
			onClick={ redo }
			className="editor-history__redo"
		/>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		hasRedo: select( 'core/editor' ).hasEditorRedo(),
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		redo: () => {
			// If there are no redo levels this is a no-op, because we don't actually
			// disable the button.
			// See: https://github.com/WordPress/gutenberg/issues/3486
			if ( ownProps.hasRedo ) {
				dispatch( 'core/editor' ).redo();
			}
		},
	} ) ),
] )( EditorHistoryRedo );
