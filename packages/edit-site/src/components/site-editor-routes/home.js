/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import Editor from '../editor';

export const homeRoute = {
	name: 'home',
	path: '/',
	areas: {
		sidebar: <SidebarNavigationScreenMain />,
		preview: <Editor isHomeRoute />,
		mobile: <SidebarNavigationScreenMain />,
	},
};
