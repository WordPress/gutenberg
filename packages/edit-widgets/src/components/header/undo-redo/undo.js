/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { undo as undoIcon } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';

function UndoButton( props, ref ) {
	const hasUndo = useSelect( ( select ) => select( 'core' ).hasUndo() );
	const { undo } = useDispatch( 'core' );
	return (
		<Button
			icon={ undoIcon }
			label={ __( 'Undo' ) }
			shortcut={ displayShortcut.primary( 'z' ) }
			// If there are no undo levels we don't want to actually disable this
			// button, because it will remove focus for keyboard users.
			// See: https://github.com/WordPress/gutenberg/issues/3486
			aria-disabled={ ! hasUndo }
			onClick={ hasUndo ? undo : undefined }
			ref={ ref }
			{ ...props }
		/>
	);
}

export default forwardRef( UndoButton );
