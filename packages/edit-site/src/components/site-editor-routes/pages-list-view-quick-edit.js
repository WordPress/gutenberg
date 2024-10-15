/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import PostList from '../post-list';
import DataViewsSidebarContent from '../sidebar-dataviews';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';
import { PostEdit } from '../post-edit';
import Editor from '../editor';

const { useLocation } = unlock( routerPrivateApis );

function PageList() {
	return <PostList postType="page" />;
}

function PageQuickEdit() {
	const { params } = useLocation();
	return <PostEdit postType="page" postId={ params.postId } />;
}

export const pagesListViewQuickEditRoute = {
	name: 'pages-list-view-quick-edit',
	match: ( params ) => {
		return (
			params.isCustom !== 'true' &&
			( params.layout ?? 'list' ) === 'list' &&
			!! params.quickEdit &&
			params.postType === 'page' &&
			params.canvas !== 'edit'
		);
	},
	areas: {
		sidebar: (
			<SidebarNavigationScreen
				title={ __( 'Pages' ) }
				backPath={ {} }
				content={ <DataViewsSidebarContent /> }
			/>
		),
		content: <PageList />,
		mobile: <PageList />,
		preview: <Editor />,
		edit: <PageQuickEdit />,
	},
	widths: {
		content: 380,
		edit: 380,
	},
};
