/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import DataViewsSidebarContent from '../sidebar-dataviews';
import SidebarNavigationScreen from '../sidebar-navigation-screen';

export const postItemRoute = {
	name: 'post-item',
	path: '/post/:postId',
	areas: {
		sidebar: (
			<SidebarNavigationScreen
				title={ __( 'Posts' ) }
				isRoot
				content={ <DataViewsSidebarContent postType="post" /> }
			/>
		),
		mobile: <Editor isPostsList />,
		preview: <Editor isPostsList />,
	},
};
