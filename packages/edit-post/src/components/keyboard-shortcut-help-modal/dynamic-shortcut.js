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
	const { keysCombination, description } = useSelect( ( select ) => {
		const { getShortcutKeysCombination, getShortcutDescription } = select( 'core/keyboard-shortcuts' );

		return {
			keysCombination: getShortcutKeysCombination( name ),
			description: getShortcutDescription( name ),
		};
	} );

	if ( ! keysCombination ) {
		return null;
	}

	const combination = keysCombination.modifier ?
		displayShortcutList[ keysCombination.modifier ]( keysCombination.character ) :
		keysCombination.character;

	return (
		<Shortcut
			keyCombination={ combination }
			description={ description }
		/>
	);
}

export default DynamicShortcut;
