import type {
	EntityLinks,
	Layout,
	MenuItem,
	Route,
	ShownEntity,
} from './types';

export function registerMenuItem( id: string, menuItem: MenuItem ) {
	return {
		type: 'REGISTER_MENU_ITEM' as const,
		id,
		menuItem,
	};
}

export function updateMenuItem( id: string, updates: Partial< MenuItem > ) {
	return {
		type: 'UPDATE_MENU_ITEM' as const,
		id,
		updates,
	};
}

export function registerRoute( route: Route ) {
	return {
		type: 'REGISTER_ROUTE' as const,
		route,
	};
}

/**
 * Registers where entities of a post type are listed and edited.
 *
 * Register `default` to cover post types with no entry of their own.
 *
 * @param postType Post type the links belong to, or `default`.
 * @param links    Paths to list and edit an entity of that post type.
 */
export function registerEntityLinks( postType: string, links: EntityLinks ) {
	return {
		type: 'REGISTER_ENTITY_LINKS' as const,
		postType,
		links,
	};
}

export function setDashboardLink( dashboardLink: string ) {
	return {
		type: 'SET_DASHBOARD_LINK' as const,
		dashboardLink,
	};
}

/**
 * Sets the layout the app renders in. `shell` frames the site and opens
 * admin workflows above it, for the experimental site shell page.
 *
 * Call it from an init module, so it is set before the app renders.
 *
 * @param layout The layout.
 */
export function setLayout( layout: Layout ) {
	return {
		type: 'SET_LAYOUT' as const,
		layout,
	};
}

/**
 * Sets what the site shell's site frame shows, so the shell's bar can name
 * it and offer to edit it.
 *
 * @param shownEntity What the site shows, or null when it is not known.
 */
export function setShownEntity( shownEntity: ShownEntity | null ) {
	return {
		type: 'SET_SHOWN_ENTITY' as const,
		shownEntity,
	};
}

/**
 * Asks the site shell's site frame to show a location on the site, such as
 * the page about to be edited.
 *
 * @param path The location's path, with any query string.
 */
export function showSitePath( path: string ) {
	return {
		type: 'SHOW_SITE_PATH' as const,
		path,
	};
}

export type Action =
	| ReturnType< typeof registerMenuItem >
	| ReturnType< typeof updateMenuItem >
	| ReturnType< typeof registerRoute >
	| ReturnType< typeof registerEntityLinks >
	| ReturnType< typeof setDashboardLink >
	| ReturnType< typeof setLayout >
	| ReturnType< typeof setShownEntity >
	| ReturnType< typeof showSitePath >;
