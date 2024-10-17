/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';

export const stylesEditRoute = {
	name: 'styles-edit',
	match: ( params ) => {
		return params.path === '/wp_global_styles' && params.canvas === 'edit';
	},
	areas: {
		sidebar: <SidebarNavigationScreenGlobalStyles backPath={ {} } />,
		preview: <Editor />,
		mobile: <Editor />,
	},
};
