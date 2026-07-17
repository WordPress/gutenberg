/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenPatterns from '../sidebar-navigation-screen-patterns';

export const templatePartItemRoute = {
	name: 'template-part-item',
	path: '/wp_template_part/*postId',
	areas: {
		sidebar: <SidebarNavigationScreenPatterns backPath="/" />,
		// Also rendered on mobile, where this route is only reached at canvas=edit.
		preview: <Editor />,
	},
};
