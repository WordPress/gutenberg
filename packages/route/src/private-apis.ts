/**
 * External dependencies
 */
import { parseHref } from '@tanstack/history';
import {
	createBrowserHistory,
	createLazyRoute,
	createLink,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
	RouterProvider,
	useCanGoBack,
	useMatches,
	useRouter,
} from '@tanstack/react-router';

/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';

/**
 * Private APIs for the boot package only.
 * These are router setup and internal utilities that should not be used
 * by individual routes.
 */
export const privateApis = {};

// Lock the private APIs so only authorized modules can access them
lock( privateApis, {
	// Router creation and setup
	createBrowserHistory,
	createLazyRoute,
	createRouter,
	createRootRoute,
	createRoute,
	Outlet,
	RouterProvider,

	// Internal routing utilities
	redirect,
	createLink,
	useCanGoBack,
	useMatches,
	useRouter,

	// History utilities
	parseHref,
} );
