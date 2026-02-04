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
import PageTemplatesLegacy from '../page-templates/index-legacy';
import {
	DEFAULT_VIEW,
	getActiveViewOverridesForTab,
} from '../page-templates/view-utils';

async function isTemplateListView( query ) {
	const { activeView = 'active' } = query;
	const view = await loadView( {
		kind: 'postType',
		name: 'wp_template',
		slug: 'default',
		defaultView: DEFAULT_VIEW,
		activeViewOverrides: getActiveViewOverridesForTab( activeView ),
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
			if ( ! isBlockTheme ) {
				return undefined;
			}
			// Use the new template activation system if experiment is enabled,
			// otherwise use the legacy simple template list.
			return window?.__experimentalTemplateActivate ? (
				<PageTemplates />
			) : (
				<PageTemplatesLegacy />
			);
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
			if ( ! isBlockTheme ) {
				return <SidebarNavigationScreenUnsupported />;
			}
			// Check if the template activation experiment is enabled.
			const isTemplateActivateEnabled =
				typeof window !== 'undefined' &&
				window.__experimentalTemplateActivate;
			// Use the new template activation system if experiment is enabled,
			// otherwise use the legacy simple template list.
			return isTemplateActivateEnabled ? (
				<PageTemplates />
			) : (
				<PageTemplatesLegacy />
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
