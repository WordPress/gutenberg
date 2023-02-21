/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';

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
			<NavigatorScreen path="/">
				<SidebarNavigationScreenMain />
			</NavigatorScreen>
			<NavigatorScreen path="/navigation">
				<SidebarNavigationScreenNavigationMenus />
			</NavigatorScreen>
			<NavigatorScreen path="/navigation/:postType/:postId">
				<SidebarNavigationScreenNavigationItem />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)">
				<SidebarNavigationScreenTemplates />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)/all">
				<SidebarNavigationScreenTemplatesBrowse />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)/:postId">
				<SidebarNavigationScreenTemplate />
			</NavigatorScreen>
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
