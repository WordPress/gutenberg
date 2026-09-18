import type {
	WidgetAction,
	WidgetHostLinks,
} from '@wordpress/widget-primitives';

/**
 * Resolves the in-app route path of a link action. `download` and
 * `openInNewTab` targets always keep the plain anchor: both mean a new
 * document, which a client-side navigation cannot deliver.
 *
 * @param {WidgetHostLinks | undefined} links  The host's `links` capability.
 * @param {WidgetAction}                action The action whose target to resolve.
 * @return {string | null} The in-app route path, or `null`.
 */
export function getActionRoute(
	links: WidgetHostLinks | undefined,
	action: WidgetAction
): string | null {
	if ( ! links || action.download || action.openInNewTab ) {
		return null;
	}

	return links.match( action.href );
}
