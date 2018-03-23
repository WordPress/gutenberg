/**
 * Internal dependencies
 */
import './style.scss';

function MenuItemsShortcut( { shortcut } ) {
	if ( ! shortcut ) {
		return null;
	}
	return (
		<span className="components-menu-items__shortcut">{ shortcut }</span>
	);
}

export default MenuItemsShortcut;
