/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import PageTemplates from '../page-templates';
import { AssignmentsDetails } from '../page-templates/assignments-details';

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
			if ( query.activeView === 'hierarchy' ) {
				return <AssignmentsDetails />;
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
			const isListView =
				query.layout === 'list' || query.activeView === 'hierarchy';
			return isListView ? 380 : undefined;
		},
		preview() {
			return undefined;
		},
	},
};
