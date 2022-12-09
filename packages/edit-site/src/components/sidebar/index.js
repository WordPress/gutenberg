/**
 * WordPress dependencies
 */
import { __experimentalNavigatorProvider as NavigatorProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenTemplates from '../sidebar-navigation-screen-templates';

export function Sidebar() {
	return (
		<NavigatorProvider
			className="edit-site-sidebar__content"
			initialPath="/"
		>
			<SidebarNavigationScreenMain />
			<SidebarNavigationScreenTemplates postType="wp_template" />
			<SidebarNavigationScreenTemplates postType="wp_template_part" />
		</NavigatorProvider>
	);
}
