/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenIdentity from '../sidebar-navigation-screen-identity';
import SidebarIdentity from '../sidebar-identity';

export const identityRoute = {
	name: 'identity',
	path: '/identity',
	areas: {
		sidebar: <SidebarNavigationScreenIdentity />,
		content: <SidebarIdentity />,
		preview: <Editor />,
		mobileContent: <SidebarIdentity />,
	},
	widths: {
		content: 380,
	},
};
