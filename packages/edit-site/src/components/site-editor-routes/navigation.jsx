import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { isThemeDataLoaded } from './utils';
import { NavigationCanvas } from '../navigation-menu-locations';

export const navigationRoute = {
	name: 'navigation',
	path: '/navigation',
	areas: {
		sidebar( { siteData } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return null;
			}
			return siteData.currentTheme.is_block_theme ? (
				<SidebarNavigationScreenNavigationMenus backPath="/" />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		preview( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? <NavigationCanvas /> : undefined;
		},
		mobileSidebar( { siteData } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return <></>;
			}
			return siteData.currentTheme.is_block_theme ? (
				<SidebarNavigationScreenNavigationMenus backPath="/" />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
};
