/**
 * Internal dependencies
 */
import SidebarNavigationScreenCustomize from '../sidebar-navigation-screen-customize';
import Editor from '../editor';

export const customizeRoute = {
	name: 'customize',
	path: '/customize',
	areas: {
		sidebar: <SidebarNavigationScreenCustomize backPath="/" />,
		preview: <Editor />,
		mobile: <SidebarNavigationScreenCustomize backPath="/" />,
	},
};
