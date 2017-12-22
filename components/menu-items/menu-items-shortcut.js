/**
 * Internal dependencies
 */
import shortcutMap from '../keyboard-shortcuts/map';

function MenuItemsShortcut( { shortcut } ) {
	shortcut = shortcutMap[ shortcut ];

	if ( ! shortcut ) {
		return null;
	}
	return (
		<span key="shortcut" style={ { float: 'right', opacity: .5 } }>{ shortcut }</span>
	);
}

export default MenuItemsShortcut;
