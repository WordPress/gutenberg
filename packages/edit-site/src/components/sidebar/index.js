/**
 * WordPress dependencies
 */
import { memo, useRef, lazy, Suspense, Fragment } from '@wordpress/element';
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import useSyncPathWithURL, {
	getPathFromURL,
} from '../sync-state-with-url/use-sync-path-with-url';
// import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import SaveHub from '../save-hub';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function lazyScreen( cb ) {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const Load = lazy( cb );
	return function Screen( props ) {
		return <Load { ...props } />;
	};
}

const screens = [
	{
		path: '/',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-main" */ '../sidebar-navigation-screen-main'
			),
	},
	{
		path: '/navigation',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-navigation-menus" */ '../sidebar-navigation-screen-navigation-menus'
			),
	},
	{
		path: '/navigation/:postType/:postId',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-navigation-menu" */ '../sidebar-navigation-screen-navigation-menu'
			),
	},
	{
		path: '/wp_global_styles',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-global-styles" */ '../sidebar-navigation-screen-global-styles'
			),
	},
	{
		path: '/page',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-pages" */ '../sidebar-navigation-screen-pages'
			),
	},
	{
		path: '/page/:postId',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-page" */ '../sidebar-navigation-screen-page'
			),
	},
	{
		path: '/pages',
		condition: () => window?.__experimentalAdminViews,
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-dataviews" */ '../sidebar-dataviews'
			),
	},
	{
		path: '/:postType(wp_template)',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-templates" */ '../sidebar-navigation-screen-templates'
			),
	},
	{
		path: '/patterns',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-patterns" */ '../sidebar-navigation-screen-patterns'
			),
	},
	{
		path: '/:postType(wp_template|wp_template_part)/all',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-templates-browse" */ '../sidebar-navigation-screen-templates-browse'
			),
	},
	{
		path: '/:postType(wp_template_part|wp_block)/:postId',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-pattern" */ '../sidebar-navigation-screen-pattern'
			),
	},
	{
		path: '/:postType(wp_template)/:postId',
		component: () =>
			import(
				/* webpackChunkName: "sidebar-screen-template" */ '../sidebar-navigation-screen-template'
			),
	},
];

function SidebarScreens() {
	useSyncPathWithURL();

	return (
		<Suspense fallback={ null }>
			{ screens.map( ( { path, component, condition } ) => {
				if ( condition !== undefined && ! condition?.() ) {
					return null;
				}

				const Screen = lazyScreen( component );

				return (
					<NavigatorScreen key={ path } path={ path }>
						<Screen />
					</NavigatorScreen>
				);
			} ) }
		</Suspense>
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
