/**
 * WordPress dependencies
 */
import { loadView } from '@wordpress/views';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import PageTemplates from '../page-templates';
import { getDefaultView } from '../page-templates/view-utils';

async function isTemplateListView( query ) {
	const { activeView = 'active' } = query;
	const view = await loadView( {
		kind: 'postType',
		name: 'wp_template',
		slug: activeView,
		defaultView: getDefaultView( activeView ),
	} );
	return view.type === 'list';
}

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
		async preview( { query, siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			if ( ! isBlockTheme ) {
				return undefined;
			}
			const isListView = await isTemplateListView( query );
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
		async content( { query } ) {
			const isListView = await isTemplateListView( query );
			return isListView ? 380 : undefined;
		},
	},
};
