/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import GlobalStylesUIWrapper from '../sidebar-global-styles-wrapper';

export const stylesViewRoute = {
	name: 'styles-view',
	match: ( params ) => {
		return (
			params.path &&
			params.path.startsWith( '/wp_global_styles' ) &&
			params.canvas !== 'edit'
		);
	},
	areas: {
		content: <GlobalStylesUIWrapper />,
		sidebar: <SidebarNavigationScreenGlobalStyles backPath={ {} } />,
		preview: <Editor isPreviewOnly />,
		mobile: <GlobalStylesUIWrapper />,
	},
	widths: {
		content: 380,
		hasResize: false,
	},
};
