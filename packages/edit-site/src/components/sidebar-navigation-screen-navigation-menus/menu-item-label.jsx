import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { unlock } from '../../lock-unlock';

const { MenuWhereUsed } = unlock( blockLibraryPrivateApis );

/**
 * A menu's name in the menus list, with where it is used beneath it when the
 * Navigation menu editing experiment is on.
 *
 * @param {Object}  props
 * @param {number}  props.navigationId The menu's ID.
 * @param {Element} props.children     The menu's name.
 * @return {Element} The label.
 */
export default function MenuItemLabel( { navigationId, children } ) {
	if ( ! globalThis?.__experimentalNavigationMenuEditing ) {
		return children;
	}

	return (
		<span className="edit-site-sidebar-navigation-screen-navigation-menus__label">
			{ children }
			<MenuWhereUsed
				navigationId={ navigationId }
				className="edit-site-sidebar-navigation-screen-navigation-menus__where-used"
			/>
		</span>
	);
}
