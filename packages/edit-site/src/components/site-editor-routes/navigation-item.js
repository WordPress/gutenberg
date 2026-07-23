/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { isThemeDataLoaded } from './utils';

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
		mobileSidebar( { siteData } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return <></>;
			}
			return siteData.currentTheme.is_block_theme ? (
				<SidebarNavigationScreenNavigationMenu backPath="/navigation" />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
};
