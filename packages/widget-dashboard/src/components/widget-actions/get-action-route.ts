import type {
	WidgetAction,
	WidgetHostLinks,
	WidgetHostRouteMatch,
} from '@wordpress/widget-primitives';

/*
 * Resolves the in-app route of a link action. `download` and `openInNewTab`
 * targets always keep the plain anchor: both mean a new document, which a
 * client-side navigation cannot deliver.
 */
export function getActionRoute(
	links: WidgetHostLinks | undefined,
	action: WidgetAction
): WidgetHostRouteMatch | null {
	if ( ! links || action.download || action.openInNewTab ) {
		return null;
	}

	return links.match( action.href );
}
