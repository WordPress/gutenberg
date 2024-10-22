/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';

export const homeEditRoute = {
	name: 'home-edit',
	match: ( params ) => {
		return params.canvas === 'edit';
	},
	areas: {
		sidebar: <SidebarNavigationScreenMain />,
		preview: <Editor />,
		mobile: <Editor />,
	},
};
