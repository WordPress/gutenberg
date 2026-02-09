/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __ } from '@wordpress/i18n';
import { loadView } from '@wordpress/views';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import DataViewsSidebarContent from '../sidebar-dataviews';
import PostList from '../post-list';
import { unlock } from '../../lock-unlock';
import {
	DEFAULT_VIEW,
	getActiveViewOverridesForTab,
} from '../post-list/view-utils';

const { useLocation } = unlock( routerPrivateApis );

async function isListView( query ) {
	const { activeView = 'all' } = query;
	const view = await loadView( {
		kind: 'postType',
		name: 'page',
		slug: 'default',
		defaultView: DEFAULT_VIEW,
		activeViewOverrides: getActiveViewOverridesForTab( activeView ),
	} );
	return view.type === 'list';
}

function MobilePagesView() {
	const { query = {} } = useLocation();
	const { canvas = 'view' } = query;

	return canvas === 'edit' ? <Editor /> : <PostList postType="page" />;
}

export const pagesRoute = {
	name: 'pages',
	path: '/page',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<SidebarNavigationScreen
					title={ __( 'Pages' ) }
					backPath="/"
					content={ <DataViewsSidebarContent postType="page" /> }
				/>
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		content( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? <PostList postType="page" /> : undefined;
		},
		async preview( { query, siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			if ( ! isBlockTheme ) {
				return undefined;
			}
			const isList = await isListView( query );
			return isList ? <Editor /> : undefined;
		},
		mobile( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<MobilePagesView />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
	widths: {
		async content( { query } ) {
			const isList = await isListView( query );
			return isList ? 380 : undefined;
		},
	},
};
