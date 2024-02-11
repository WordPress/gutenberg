/**
 * External dependencies
 */
import classNames from 'classnames';

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
import SidebarNavigationScreenPatterns from '../sidebar-navigation-screen-patterns';
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
import SidebarNavigationScreenPagesDataViews from '../sidebar-navigation-screen-pages-dataviews';
import SidebarNavigationScreenPage from '../sidebar-navigation-screen-page';

const { useLocation } = unlock( routerPrivateApis );

function SidebarScreenWrapper( { className, ...props } ) {
	return (
		<NavigatorScreen
			className={ classNames(
				'edit-site-sidebar__screen-wrapper',
				className
			) }
			{ ...props }
		/>
	);
}

function SidebarScreens() {
	useSyncPathWithURL();

	return (
		<>
			<SidebarScreenWrapper path="/">
				<SidebarNavigationScreenMain />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/navigation">
				<SidebarNavigationScreenNavigationMenus />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/navigation/:postType/:postId">
				<SidebarNavigationScreenNavigationMenu />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/wp_global_styles">
				<SidebarNavigationScreenGlobalStyles />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/page">
				<SidebarNavigationScreenPages />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/pages">
				<SidebarNavigationScreenPagesDataViews />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/page/:postId">
				<SidebarNavigationScreenPage />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/:postType(wp_template)">
				<SidebarNavigationScreenTemplates />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/patterns">
				<SidebarNavigationScreenPatterns />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/:postType(wp_template|wp_template_part)/all">
				<SidebarNavigationScreenTemplatesBrowse />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/:postType(wp_template_part|wp_block)/:postId">
				<SidebarNavigationScreenPattern />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/:postType(wp_template)/:postId">
				<SidebarNavigationScreenTemplate />
			</SidebarScreenWrapper>
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
