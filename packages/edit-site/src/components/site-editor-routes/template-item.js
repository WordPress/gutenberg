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
	mobile( { siteData } ) {
		if ( ! isThemeDataLoaded( siteData ) ) {
			return <></>;
		}
		return siteData.currentTheme.is_block_theme ? (
			<Editor />
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
};

export const templateItemRoute = {
	name: 'template-item',
	path: '/wp_template/*postId',
	areas,
};
