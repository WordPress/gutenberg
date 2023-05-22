/**
 * WordPress dependencies
 */

import { __experimentalNavigatorButton as NavigatorButton } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';

const NAVIGATION_MENUS_QUERY = {
	per_page: -1,
	status: 'publish',
	order: 'desc',
	orderby: 'date',
};

export default function SidebarNavigationScreenNavigationMenuButton( {
	children,
	...props
} ) {
	const { records: navigationMenus, isResolving: isLoading } =
		useEntityRecords( 'postType', `wp_navigation`, NAVIGATION_MENUS_QUERY );

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasSingleNavigationMenu = navigationMenus?.length === 1;
	const firstNavigationMenu = navigationMenus?.[ 0 ];

	const showNavigationScreen = process.env.IS_GUTENBERG_PLUGIN
		? hasNavigationMenus
		: false;

	// If there is a single menu then we can go directly to that menu.
	// Otherwise we go to the navigation listing screen.
	const path = hasSingleNavigationMenu
		? `/navigation/${ firstNavigationMenu?.id }`
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
