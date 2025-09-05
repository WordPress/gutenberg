/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import PageTemplates from '../page-templates';

export const templatesRoute = {
	name: 'templates',
	path: '/template',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<SidebarNavigationScreenTemplatesBrowse backPath="/" />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		content( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? <PageTemplates /> : undefined;
		},
		preview( { query, siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			if ( ! isBlockTheme ) {
				return undefined;
			}
			const isListView = query.layout === 'list';
			return isListView ? <Editor /> : undefined;
		},
		mobile( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<PageTemplates />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
	widths: {
		content( { query } ) {
			const isListView = query.layout === 'list';
			return isListView ? 380 : undefined;
		},
	},
};
