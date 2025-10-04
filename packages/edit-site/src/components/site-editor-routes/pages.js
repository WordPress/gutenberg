/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import DataViewsSidebarContent from '../sidebar-dataviews';
import PostList from '../post-list';
import { unlock } from '../../lock-unlock';
import { PostEdit } from '../post-edit';

const { useLocation } = unlock( routerPrivateApis );

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
		preview( { query, siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			if ( ! isBlockTheme ) {
				return undefined;
			}
			const isListView =
				( query.layout === 'list' || ! query.layout ) &&
				query.isCustom !== 'true';
			return isListView ? <Editor /> : undefined;
		},
		mobile( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<MobilePagesView />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		edit( { query } ) {
			const hasQuickEdit =
				( query.layout ?? 'list' ) !== 'list' && !! query.quickEdit;
			return hasQuickEdit ? (
				<PostEdit postType="page" postId={ query.postId } />
			) : undefined;
		},
	},
	widths: {
		content( { query } ) {
			const isListView =
				( query.layout === 'list' || ! query.layout ) &&
				query.isCustom !== 'true';
			return isListView ? 380 : undefined;
		},
		edit( { query } ) {
			const hasQuickEdit =
				( query.layout ?? 'list' ) !== 'list' && !! query.quickEdit;
			return hasQuickEdit ? 380 : undefined;
		},
	},
};
