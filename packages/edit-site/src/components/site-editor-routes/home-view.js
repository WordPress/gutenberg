/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';

export const homeViewRoute = {
	name: 'home-view',
	match: ( params ) => {
		return params.canvas !== 'edit';
	},
	areas: {
		sidebar: <SidebarNavigationScreenMain />,
		preview: <Editor />,
	},
};
