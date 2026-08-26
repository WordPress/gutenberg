import type {
	WidgetAction,
	WidgetHostLinks,
} from '@wordpress/widget-primitives';

/**
 * Resolves the in-app route path of a link action. `download` and
 * `openInNewTab` targets always keep the plain anchor: both mean a new
 * document, which a client-side navigation cannot deliver. Every
 * `download` value but `false` downloads; `true` and the empty string
 * keep the original filename.
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
