/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Shortcut from './shortcut';

function DynamicShortcut( { name } ) {
	const { keyCombination, description, aliases } = useSelect( ( select ) => {
		const {
			getShortcutKeyCombination,
			getShortcutDescription,
			getShortcutAliases,
		} = select( 'core/keyboard-shortcuts' );

		return {
			keyCombination: getShortcutKeyCombination( name ),
			aliases: getShortcutAliases( name ),
			description: getShortcutDescription( name ),
		};
	} );

	if ( ! keyCombination ) {
		return null;
	}

	return (
		<Shortcut
			keyCombination={ keyCombination }
			description={ description }
			aliases={ aliases }
		/>
	);
}

export default DynamicShortcut;
