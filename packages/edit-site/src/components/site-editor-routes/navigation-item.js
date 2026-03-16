/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function MobileNavigationItemView() {
	const { query = {} } = useLocation();
	const { canvas = 'view' } = query;

	return canvas === 'edit' ? (
		<Editor />
	) : (
		<SidebarNavigationScreenNavigationMenu backPath="/navigation" />
	);
}

export const navigationItemRoute = {
	name: 'navigation-item',
	path: '/wp_navigation/:postId',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<SidebarNavigationScreenNavigationMenu backPath="/navigation" />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		preview( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<Editor />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		mobile( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<MobileNavigationItemView />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
};
