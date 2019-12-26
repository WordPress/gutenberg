/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { displayShortcutList } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Shortcut from './shortcut';

function DynamicShortcut( { name } ) {
	const { keyCombination, description } = useSelect( ( select ) => {
		const { getShortcutKeyCombination, getShortcutDescription } = select( 'core/keyboard-shortcuts' );

		return {
			keyCombination: getShortcutKeyCombination( name ),
			description: getShortcutDescription( name ),
		};
	} );

	if ( ! keyCombination ) {
		return null;
	}

	const combination = keyCombination.modifier ?
		displayShortcutList[ keyCombination.modifier ]( keyCombination.character ) :
		keyCombination.character;

	return (
		<Shortcut
			keyCombination={ combination }
			description={ description }
		/>
	);
}

export default DynamicShortcut;
