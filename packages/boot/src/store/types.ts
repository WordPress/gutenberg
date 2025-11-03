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
 * All routes must specify a content_module that exports surfaces.
 */
export interface Route {
	/**
	 * Route path (e.g., "/post-edit/$postId")
	 */
	path: string;

	/**
	 * Hook executed before the route loads.
	 * Can throw redirect() or notFound() to prevent navigation.
	 */
	beforeLoad?: ( context: RouteLoaderContext ) => void | Promise< void >;

	/**
	 * Async data preloading function.
	 * The returned data is available to route components.
	 */
	loader?: ( context: RouteLoaderContext ) => Promise< unknown >;

	/**
	 * Module path for lazy loading the route's surfaces.
	 * The module must export: RouteSurfaces
	 * This enables code splitting for better performance.
	 */
	content_module?: string;

	/**
	 * If the route is not lazy loaded, it can define a static "content" property.
	 */
	content?: RouteSurfaces;
}

export interface State {
	menuItems: Record< string, MenuItem >;
	routes: Route[];
}
