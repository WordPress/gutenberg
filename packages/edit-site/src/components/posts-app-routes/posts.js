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
import DataViewsSidebarContent from '../sidebar-dataviews';
import PostList from '../post-list';
import { unlock } from '../../lock-unlock';
import { PostEdit } from '../post-edit';

const { useLocation } = unlock( routerPrivateApis );

function MobilePostsView() {
	const { query = {} } = useLocation();
	const { canvas = 'view' } = query;

	return canvas === 'edit' ? <Editor /> : <PostList postType="post" />;
}

export const postsRoute = {
	name: 'posts',
	path: '/',
	areas: {
		sidebar: (
			<SidebarNavigationScreen
				title={ __( 'Posts' ) }
				isRoot
				content={ <DataViewsSidebarContent postType="post" /> }
			/>
		),
		content: <PostList postType="post" />,
		preview( { query } ) {
			const isListView =
				( query.layout === 'list' || ! query.layout ) &&
				query.isCustom !== 'true';
			return isListView ? <Editor isPostsList /> : undefined;
		},
		mobile: <MobilePostsView />,
		edit( { query } ) {
			const hasQuickEdit =
				( query.layout ?? 'list' ) === 'list' && !! query.quickEdit;
			return hasQuickEdit ? (
				<PostEdit postType="post" postId={ query.postId } />
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
				( query.layout ?? 'list' ) === 'list' && !! query.quickEdit;
			return hasQuickEdit ? 380 : undefined;
		},
	},
};
