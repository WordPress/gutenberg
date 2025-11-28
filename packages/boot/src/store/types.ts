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
 * Canvas data returned by route's canvas function.
 */
export interface CanvasData {
	/**
	 * Post type to render in the canvas.
	 */
	postType: string;

	/**
	 * Post ID to render in the canvas.
	 */
	postId: string;

	/**
	 * Indicates if the canvas is in preview mode.
	 */
	isPreview?: boolean;
	/**
	 * Optional edit link for click-to-edit navigation.
	 * When provided with isPreview: true, clicking the canvas navigates to this URL.
	 */
	editLink?: string;
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
	 * Module path for lazy loading the route's surfaces.
	 * The module can export:
	 * - stage?: Main content component (ComponentType)
	 * - inspector?: Sidebar component (ComponentType)
	 * - canvas?: Custom canvas component (ComponentType)
	 * This enables code splitting for better performance.
	 */
	content_module?: string;

	/**
	 * Module path for route lifecycle functions.
	 * The module should export a named export `route` containing:
	 * - beforeLoad?: Pre-navigation hook (authentication, validation, redirects)
	 * - loader?: Data preloading function
	 * - canvas?: Function that returns canvas data for rendering
	 *   - Returns CanvasData to use default editor canvas
	 *   - Returns null to use custom canvas component from content_module
	 *   - Returns undefined to show no canvas
	 */
	route_module?: string;
}

export interface State {
	menuItems: Record< string, MenuItem >;
	routes: Route[];
}
