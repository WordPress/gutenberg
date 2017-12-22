/**
 * Internal dependencies
 */
import shortcutMap from '../keyboard-shortcuts/map';

function MenuItemsShortcut( { shortcut } ) {
	const shortcutVal = shortcutMap[ shortcut ];

	if ( ! shortcutVal ) {
		return null;
	}
	return (
		<span key={ shortcut } style={ { float: 'right', opacity: .5 } }>{ shortcutVal }</span>
	);
}

export default MenuItemsShortcut;
