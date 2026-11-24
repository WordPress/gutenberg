import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import type { ReactNode } from 'react';
import { unlock } from '../../lock-unlock';

const { MenuWhereUsed } = unlock( blockLibraryPrivateApis );

/**
 * A menu's name in the menus list, with where it is used beneath it when the
 * Navigation menu editing experiment is on.
 *
 * @param props
 * @param props.navigationId The menu's ID.
 * @param props.children     The menu's name.
 * @return The label.
 */
export default function MenuItemLabel( {
	navigationId,
	children,
}: {
	navigationId: number;
	children: ReactNode;
} ) {
	if (
		! (
			globalThis as typeof globalThis & {
				__experimentalNavigationMenuEditing?: boolean;
			}
		 )?.__experimentalNavigationMenuEditing
	) {
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
