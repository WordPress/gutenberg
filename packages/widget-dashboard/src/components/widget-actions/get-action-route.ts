import type {
	WidgetAction,
	WidgetHostLinks,
} from '@wordpress/widget-primitives';

/**
 * Resolves the in-app route path of a link action. `download` (any value
 * but `false`) and `openInNewTab` keep the plain anchor: both mean a new
 * document.
 *
 * @param {WidgetHostLinks | undefined} links  The host's `links` capability.
 * @param {WidgetAction}                action The action whose target to resolve.
 * @return {string | null} The in-app route path, or `null`.
 */
export function getActionRoute(
	links: WidgetHostLinks | undefined,
	action: WidgetAction
): string | null {
	const isDownload =
		action.download !== undefined && action.download !== false;

	if ( ! links || isDownload || action.openInNewTab ) {
		return null;
	}

	return links.match( action.href );
}
