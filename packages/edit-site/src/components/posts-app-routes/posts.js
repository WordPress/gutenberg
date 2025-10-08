/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __ } from '@wordpress/i18n';
import { loadView } from '@wordpress/views';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import DataViewsSidebarContent from '../sidebar-dataviews';
import PostList from '../post-list';
import { unlock } from '../../lock-unlock';
import { PostEdit } from '../post-edit';
import { getDefaultView } from '../post-list/view-utils';

const { useLocation } = unlock( routerPrivateApis );

async function isListView( query ) {
	const { activeView = 'all' } = query;
	const postTypeObject =
		await resolveSelect( coreStore ).getPostType( 'post' );
	const view = await loadView( {
		kind: 'postType',
		name: 'post',
		slug: activeView,
		defaultView: getDefaultView( postTypeObject, activeView ),
	} );
	return view.type === 'list';
}

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
		async preview( { query } ) {
			const isList = await isListView( query );
			return isList ? <Editor isPostsList /> : undefined;
		},
		mobile: <MobilePostsView />,
		async edit( { query } ) {
			const isList = await isListView( query );
			const hasQuickEdit = ! isList && !! query.quickEdit;
			return hasQuickEdit ? (
				<PostEdit postType="post" postId={ query.postId } />
			) : undefined;
		},
	},
	widths: {
		async content( { query } ) {
			const isList = await isListView( query );
			return isList ? 380 : undefined;
		},
		async edit( { query } ) {
			const isList = await isListView( query );
			const hasQuickEdit = ! isList && !! query.quickEdit;
			return hasQuickEdit ? 380 : undefined;
		},
	},
};
