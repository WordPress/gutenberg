/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

export function KeyboardShortcutsHelpMenuItem( { openModal } ) {
	return (
		<MenuItem
			onClick={ () => {
				openModal( 'editor/keyboard-shortcut-help' );
			} }
			shortcut={ displayShortcut.access( 'h' ) }
		>
			{ __( 'Keyboard shortcuts' ) }
		</MenuItem>
	);
}

export default withDispatch( ( dispatch ) => {
	const { openModal } = dispatch( interfaceStore );

	return {
		openModal,
	};
} )( KeyboardShortcutsHelpMenuItem );
