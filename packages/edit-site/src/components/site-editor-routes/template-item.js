/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { isThemeDataLoaded } from './utils';

const areas = {
	sidebar( { siteData } ) {
		if ( ! isThemeDataLoaded( siteData ) ) {
			return null;
		}
		return siteData.currentTheme.is_block_theme ? (
			<SidebarNavigationScreenTemplatesBrowse backPath="/" />
		) : (
			<SidebarNavigationScreenUnsupported />
		);
	},
	// Also rendered on mobile, where this route is only reached at canvas=edit.
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
};

export const templateItemRoute = {
	name: 'template-item',
	path: '/wp_template/*postId',
	areas,
};
