/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenTemplate from '../sidebar-navigation-screen-template';
import SidebarNavigationScreenPatterns from '../sidebar-navigation-screen-patterns';
import SidebarNavigationScreenPattern from '../sidebar-navigation-screen-pattern';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SaveHub from '../save-hub';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import DataViewsSidebarContent from '../sidebar-dataviews';
import SidebarNavigationScreenPage from '../sidebar-navigation-screen-page';

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
	const isMobileViewport = useViewportMatch( 'medium', '<' );

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
				<SidebarNavigationScreen
					title={ __( 'Manage pages' ) }
					content={ <DataViewsSidebarContent /> }
				/>
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/page/:postId">
				<SidebarNavigationScreenPage />
			</SidebarScreenWrapper>
			<SidebarScreenWrapper path="/:postType(wp_template)">
				<SidebarNavigationScreenTemplatesBrowse />
			</SidebarScreenWrapper>
			{ ! isMobileViewport && (
				<SidebarScreenWrapper path="/patterns">
					<SidebarNavigationScreenPatterns />
				</SidebarScreenWrapper>
			) }
			<SidebarScreenWrapper path="/:postType(wp_template_part)/all">
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

function Sidebar( { router } ) {
	return (
		<>
			<NavigatorProvider
				className="edit-site-sidebar__content"
				router={ router }
			>
				<SidebarScreens />
			</NavigatorProvider>
			<SaveHub />
		</>
	);
}

export default memo( Sidebar );
