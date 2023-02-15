/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { __experimentalNavigatorProvider as NavigatorProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenTemplates from '../sidebar-navigation-screen-templates';
import SidebarNavigationScreenTemplate from '../sidebar-navigation-screen-template';
import useSyncPathWithURL from '../sync-state-with-url/use-sync-path-with-url';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SaveButton from '../save-button';
import SidebarNavigationScreenNavigationItem from '../sidebar-navigation-screen-navigation-item';

function SidebarScreens() {
	useSyncPathWithURL();

	return (
		<>
			<SidebarNavigationScreenMain />
			<SidebarNavigationScreenNavigationMenus />
			<SidebarNavigationScreenNavigationItem />
			<SidebarNavigationScreenTemplates postType="wp_template" />
			<SidebarNavigationScreenTemplates postType="wp_template_part" />
			<SidebarNavigationScreenTemplate postType="wp_template" />
			<SidebarNavigationScreenTemplate postType="wp_template_part" />
			<SidebarNavigationScreenTemplatesBrowse postType="wp_template" />
			<SidebarNavigationScreenTemplatesBrowse postType="wp_template_part" />
		</>
	);
}

function Sidebar() {
	return (
		<>
			<NavigatorProvider
				className="edit-site-sidebar__content"
				initialPath="/"
			>
				<SidebarScreens />
			</NavigatorProvider>

			<div className="edit-site-sidebar__footer">
				<SaveButton />
			</div>
		</>
	);
}

export default memo( Sidebar );
