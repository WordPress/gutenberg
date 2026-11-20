import Editor from '../editor';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { isThemeDataLoaded } from './utils';
import { NavigationMenuItemCanvas } from '../navigation-menu-locations';
import NavigationMenuPage from '../navigation-menu-locations/menu-page';

/*
 * With the menu editing experiment on, this follows the Pages screen. The dark
 * sidebar lists the menus, the white panel lists the open menu's items, and
 * the canvas previews the menu or shows where it's used. "Edit" from a menu's
 * actions still opens the editor.
 */
function isMenuPage( query ) {
	return (
		!! globalThis.__experimentalNavigationMenuEditing &&
		query?.canvas !== 'edit'
	);
}

function sidebar( { siteData } ) {
	if ( ! isThemeDataLoaded( siteData ) ) {
		return null;
	}
	if ( ! siteData.currentTheme.is_block_theme ) {
		return <SidebarNavigationScreenUnsupported />;
	}
	return globalThis.__experimentalNavigationMenuEditing ? (
		<SidebarNavigationScreenNavigationMenus backPath="/" />
	) : (
		<SidebarNavigationScreenNavigationMenu backPath="/navigation" />
	);
}

export const navigationItemRoute = {
	name: 'navigation-item',
	path: '/wp_navigation/:postId',
	areas: {
		sidebar,
		content( { siteData, query, params } ) {
			if (
				! isThemeDataLoaded( siteData ) ||
				! siteData.currentTheme.is_block_theme ||
				! isMenuPage( query )
			) {
				return undefined;
			}
			return (
				<NavigationMenuPage navigationId={ Number( params.postId ) } />
			);
		},
		preview( { siteData, query } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return null;
			}
			if ( ! siteData.currentTheme.is_block_theme ) {
				return <SidebarNavigationScreenUnsupported />;
			}
			if ( globalThis.__experimentalNavigationMenuEditing ) {
				return isMenuPage( query ) ? (
					<NavigationMenuItemCanvas />
				) : (
					<Editor />
				);
			}
			return <NavigationMenuItemCanvas />;
		},
		mobileSidebar: sidebar,
	},
	widths: {
		content( { query } ) {
			return isMenuPage( query ) ? 380 : undefined;
		},
	},
};
