/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';

const areas = {
	sidebar( { siteData } ) {
		const isBlockTheme = siteData.currentTheme?.is_block_theme;
		return isBlockTheme ? (
			<SidebarNavigationScreenTemplatesBrowse backPath="/" />
		) : (
			<SidebarNavigationScreenUnsupported />
		);
	},
	mobile( { siteData } ) {
		const isBlockTheme = siteData.currentTheme?.is_block_theme;
		return isBlockTheme ? (
			<Editor />
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
};

export const templateItemRoute = {
	name: 'template-item',
	path: '/wp_template/*postId',
	areas,
};
