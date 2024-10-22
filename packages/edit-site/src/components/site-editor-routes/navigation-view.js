/**
 * Internal dependencies
 */
import { NAVIGATION_POST_TYPE } from '../../utils/constants';
import Editor from '../editor';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';

export const navigationViewRoute = {
	name: 'navigation-view',
	match: ( params ) => {
		return (
			params.postType === NAVIGATION_POST_TYPE &&
			! params.postId &&
			params.canvas !== 'edit'
		);
	},
	areas: {
		sidebar: <SidebarNavigationScreenNavigationMenus backPath={ {} } />,
		preview: <Editor />,
	},
};
