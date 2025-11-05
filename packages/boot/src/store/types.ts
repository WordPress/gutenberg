/**
 * External dependencies
 */
import type { ReactNode, ComponentType } from 'react';

/**
 * Icon type supporting multiple formats:
 * - Dashicon strings (e.g., "dashicons-admin-generic")
 * - JSX elements
 * - SVG icons from @wordpress/icons
 * - Data URLs for images
 */
export type IconType = string | JSX.Element | ReactNode;

export interface MenuItem {
	id: string;
	label: string;
	to: string;
	icon?: IconType;
	parent?: string;
	parent_type?: 'drilldown' | 'dropdown';
}

/**
 * Route surfaces exported from content_module.
 * Stage is required, inspector is optional.
 */
export interface RouteSurfaces {
	stage?: ComponentType;
	inspector?: ComponentType;
}

/**
 * Route loader context containing params and search.
 */
export interface RouteLoaderContext {
	params: Record< string, string >;
	search: Record< string, unknown >;
}

/**
 * Route configuration interface.
 * Routes specify content_module for surfaces and optionally route_module for lifecycle functions.
 */
export interface Route {
	/**
	 * Route path (e.g., "/post-edit/$postId")
	 */
	path: string;

	/**
	 * Module path for lazy loading the route's surfaces (stage, inspector).
	 * The module must export: RouteSurfaces (stage and/or inspector components)
	 * This enables code splitting for better performance.
	 */
	content_module?: string;

	/**
	 * Module path for route lifecycle functions.
	 * The module should export a named export `route` containing:
	 * - beforeLoad?: Pre-navigation hook (authentication, validation, redirects)
	 * - loader?: Data preloading function
	 */
	route_module?: string;
}

export interface State {
	menuItems: Record< string, MenuItem >;
	routes: Route[];
}
