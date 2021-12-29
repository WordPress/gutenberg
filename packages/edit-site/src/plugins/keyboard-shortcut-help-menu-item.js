/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { displayShortcut } from '@wordpress/keycodes';
import { MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import KeyboardShortcutHelpModal from '../components/keyboard-shortcut-help-modal';

export default function KeyboardShortcutsHelpMenuItem() {
	const [ isModalActive, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	useShortcut( 'core/edit-site/keyboard-shortcuts', toggleModal );

	return (
		<>
			<MenuItem
				onClick={ toggleModal }
				shortcut={ displayShortcut.access( 'h' ) }
			>
				{ __( 'Keyboard shortcuts' ) }
			</MenuItem>
			<KeyboardShortcutHelpModal
				isModalActive={ isModalActive }
				toggleModal={ toggleModal }
			/>
		</>
	);
}
