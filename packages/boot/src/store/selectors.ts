import type { State } from './types';

export function getMenuItems( state: State ) {
	return Object.values( state.menuItems );
}

export function getRoutes( state: State ) {
	return state.routes;
}

export function getDashboardLink( state: State ) {
	return state.dashboardLink;
}

/**
 * Returns the path an entity is edited or listed at.
 *
 * Falls back to the links registered for `default`, so a post type with no
 * entry of its own still resolves.
 *
 * @param state    Store state.
 * @param postType Post type to resolve for.
 * @param postId   Entity to edit. Omit for the list of the post type.
 * @return The path, or undefined when nothing is registered for it.
 */
export function getEntityLink(
	state: State,
	postType: string,
	postId?: string | number
) {
	const links = state.entityLinks[ postType ] ?? state.entityLinks.default;
	const path = postId === undefined ? links?.list : links?.edit;

	if ( ! path ) {
		return undefined;
	}

	return path
		.replace( '{type}', encodeURIComponent( postType ) )
		.replace( '{id}', encodeURIComponent( postId ?? '' ) );
}
