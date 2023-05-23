/**
 * WordPress dependencies
 */

import { __experimentalNavigatorButton as NavigatorButton } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { PRELOADED_NAVIGATION_MENUS_QUERY } from './constants';

export default function SidebarNavigationScreenNavigationMenuButton( {
	children,
	...props
} ) {
	const { records: navigationMenus, isResolving: isLoading } =
		useEntityRecords(
			'postType',
			`wp_navigation`,
			PRELOADED_NAVIGATION_MENUS_QUERY
		);

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasSingleNavigationMenu = navigationMenus?.length === 1;
	const firstNavigationMenu = navigationMenus?.[ 0 ];

	const showNavigationScreen = process.env.IS_GUTENBERG_PLUGIN
		? hasNavigationMenus
		: false;

	// If there is a single menu then we can go directly to that menu.
	// Otherwise we go to the navigation listing screen.
	const path = hasSingleNavigationMenu
		? `/navigation/wp_navigation/${ firstNavigationMenu?.id }`
		: '/navigation';

	if ( ! showNavigationScreen ) {
		return null;
	}

	return (
		<NavigatorButton { ...props } disabled={ isLoading } path={ path }>
			{ children }
		</NavigatorButton>
	);
}
