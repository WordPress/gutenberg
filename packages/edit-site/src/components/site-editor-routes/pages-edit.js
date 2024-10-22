/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostList from '../post-list';
import DataViewsSidebarContent from '../sidebar-dataviews';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import Editor from '../editor';

function PageList() {
	return <PostList postType="page" />;
}

export const pagesEditRoute = {
	name: 'pages-edit',
	match: ( params ) => {
		return params.postType === 'page' && params.canvas === 'edit';
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
		mobile: <Editor />,
		preview: <Editor />,
	},
};
