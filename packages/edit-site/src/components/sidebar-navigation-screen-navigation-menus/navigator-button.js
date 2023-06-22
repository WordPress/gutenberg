/**
 * WordPress dependencies
 */

import { __experimentalNavigatorButton as NavigatorButton } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { PRELOADED_NAVIGATION_MENUS_QUERY } from './constants';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';

export default function SidebarNavigationScreenNavigationMenuButton( props ) {
	const { records: navigationMenus } = useEntityRecords(
		'postType',
		`wp_navigation`,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const hasSingleNavigationMenu = navigationMenus?.length === 1;
	const firstNavigationMenu = navigationMenus?.[ 0 ];

	const linkInfo = useLink( {
		postId: firstNavigationMenu?.id,
		postType: 'wp_navigation',
	} );

	// If there is a single Navigation then link directly to it.
	if ( hasSingleNavigationMenu ) {
		return <SidebarNavigationItem { ...linkInfo } { ...props } />;
	}

	return (
		<NavigatorButton { ...props } path="/navigation">
			{ props.children }
		</NavigatorButton>
	);
}
