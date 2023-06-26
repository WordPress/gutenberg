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
import SidebarNavigationScreenLibrary from '../sidebar-navigation-screen-library';
import SidebarNavigationScreenTemplates from '../sidebar-navigation-screen-templates';
import SidebarNavigationScreenTemplate from '../sidebar-navigation-screen-template';
import SidebarNavigationScreenPattern from '../sidebar-navigation-screen-pattern';
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
			<NavigatorScreen path="/:postType(wp_template)">
				<SidebarNavigationScreenTemplates />
			</NavigatorScreen>
			<NavigatorScreen path="/library">
				<SidebarNavigationScreenLibrary />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template_part|wp_block)/:postId">
				<SidebarNavigationScreenPattern />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template)/all">
				<SidebarNavigationScreenTemplatesBrowse />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template)/:postId">
				<SidebarNavigationScreenTemplate />
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
