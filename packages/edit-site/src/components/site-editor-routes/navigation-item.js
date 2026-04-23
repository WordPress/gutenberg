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
import { isThemeDataLoaded } from './utils';

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
			if ( ! isThemeDataLoaded( siteData ) ) {
				return null;
			}
			return siteData.currentTheme.is_block_theme ? (
				<SidebarNavigationScreenNavigationMenu backPath="/navigation" />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		preview( { siteData } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return null;
			}
			return siteData.currentTheme.is_block_theme ? (
				<Editor />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		mobile( { siteData } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return <></>;
			}
			return siteData.currentTheme.is_block_theme ? (
				<MobileNavigationItemView />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
};
