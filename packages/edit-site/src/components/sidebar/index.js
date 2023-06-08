/**
 * WordPress dependencies
 */
import { memo, useRef } from '@wordpress/element';
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenTemplates from '../sidebar-navigation-screen-templates';
import SidebarNavigationScreenTemplate from '../sidebar-navigation-screen-template';
import SidebarNavigationScreenTemplatePart from '../sidebar-navigation-screen-template-part';
import useSyncPathWithURL, {
	getPathFromURL,
} from '../sync-state-with-url/use-sync-path-with-url';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SaveHub from '../save-hub';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenPages from '../sidebar-navigation-screen-pages';
import SidebarNavigationScreenPage from '../sidebar-navigation-screen-page';

const { useLocation } = unlock( routerPrivateApis );

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
				<SidebarNavigationScreenNavigationMenu />
			</NavigatorScreen>
			<NavigatorScreen path="/wp_global_styles">
				<SidebarNavigationScreenGlobalStyles />
			</NavigatorScreen>
			<NavigatorScreen path="/page">
				<SidebarNavigationScreenPages />
			</NavigatorScreen>
			<NavigatorScreen path="/page/:postId">
				<SidebarNavigationScreenPage />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)">
				<SidebarNavigationScreenTemplates />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)/all">
				<SidebarNavigationScreenTemplatesBrowse />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template)/:postId">
				<SidebarNavigationScreenTemplate />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template_part)/:postId">
				<SidebarNavigationScreenTemplatePart />
			</NavigatorScreen>
		</>
	);
}

function Sidebar() {
	const { params: urlParams } = useLocation();
	const initialPath = useRef( getPathFromURL( urlParams ) );

	return (
		<>
			<NavigatorProvider
				className="edit-site-sidebar__content"
				initialPath={ initialPath.current }
			>
				<SidebarScreens />
			</NavigatorProvider>
			<SaveHub />
		</>
	);
}

export default memo( Sidebar );
