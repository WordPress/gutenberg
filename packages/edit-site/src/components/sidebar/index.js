/**
 * WordPress dependencies
 */
import { __experimentalNavigatorProvider as NavigatorProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenTemplates from '../sidebar-navigation-screen-templates';
import useSyncSidebarPathWithURL from '../sync-state-with-url/use-sync-sidebar-path-with-url';

function SidebarScreens() {
	useSyncSidebarPathWithURL();

	return (
		<>
			<SidebarNavigationScreenMain />
			<SidebarNavigationScreenTemplates postType="wp_template" />
			<SidebarNavigationScreenTemplates postType="wp_template_part" />
		</>
	);
}

export function Sidebar() {
	return (
		<NavigatorProvider
			className="edit-site-sidebar__content"
			initialPath="/"
		>
			<SidebarScreens />
		</NavigatorProvider>
	);
}
