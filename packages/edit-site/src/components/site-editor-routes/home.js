/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import Editor from '../editor';
import { isClassicThemeWithStyleBookSupport } from './utils';

export const homeRoute = {
	name: 'home',
	path: '/',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ||
				isClassicThemeWithStyleBookSupport( siteData ) ? (
				<SidebarNavigationScreenMain />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		preview( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ||
				isClassicThemeWithStyleBookSupport( siteData ) ? (
				<Editor isHomeRoute />
			) : undefined;
		},
		mobile( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ||
				isClassicThemeWithStyleBookSupport( siteData ) ? (
				<SidebarNavigationScreenMain />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
};
