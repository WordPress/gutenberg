/**
 * Module-level cache for Gravatar checks.
 *
 * WordPress always returns a Gravatar URL in `avatar_urls`, even when the user
 * has no custom image — Gravatar serves a default placeholder. This utility
 * rewrites the URL to use `d=404` so Gravatar returns a 404 for defaults,
 * then preloads the image to determine whether the user has a real avatar.
 *
 * Results are cached so repeated calls for the same URL are free.
 */

const cache = new Map< string, boolean >();
const pending = new Set< string >();
const callbacks = new Map< string, Array< () => void > >();

/**
 * Returns whether a URL has been confirmed as a custom (non-default) Gravatar.
 * Only returns true after checkGravatar has resolved for that URL.
 *
 * @param url - The Gravatar URL to check.
 */
export function hasCustomGravatar( url: string ): boolean {
	return cache.get( url ) ?? false;
}

/**
 * Returns the URL if it is a confirmed custom Gravatar, undefined otherwise.
 * Convenience wrapper for passing directly to Avatar `src`.
 *
 * @param url - The Gravatar URL to resolve.
 */
export function resolveGravatarUrl(
	url: string | undefined
): string | undefined {
	return url && hasCustomGravatar( url ) ? url : undefined;
}

/**
 * Initiates an async check for a Gravatar URL. Rewrites the URL with `d=404`
 * and preloads it as an image. Calls `onLoaded` when the check completes
 * successfully (real avatar found).
 *
 * @param url      - The Gravatar URL to check.
 * @param onLoaded - Optional callback fired when a real avatar is confirmed.
 */
export function checkGravatar( url: string, onLoaded?: () => void ): void {
	if ( cache.has( url ) ) {
		if ( cache.get( url ) && onLoaded ) {
			onLoaded();
		}
		return;
	}

	if ( onLoaded ) {
		const queue = callbacks.get( url ) ?? [];
		queue.push( onLoaded );
		callbacks.set( url, queue );
	}

	if ( pending.has( url ) ) {
		return;
	}

	pending.add( url );

	let testUrl: string;
	try {
		const parsed = new URL( url );
		parsed.searchParams.set( 'd', '404' );
		testUrl = parsed.toString();
	} catch {
		cache.set( url, false );
		pending.delete( url );
		callbacks.delete( url );
		return;
	}

	const img = new window.Image();
	img.onload = () => {
		cache.set( url, true );
		pending.delete( url );
		const queue = callbacks.get( url );
		callbacks.delete( url );
		queue?.forEach( ( cb ) => cb() );
	};
	img.onerror = () => {
		cache.set( url, false );
		pending.delete( url );
		callbacks.delete( url );
	};
	img.src = testUrl;
}

/**
 * Extracts the best available avatar URL from a collaborator's avatar_urls map.
 * Prefers the 48px size, then 96px, then 24px.
 *
 * @param avatarUrls - The avatar_urls map from collaborator info.
 */
export function getAvatarUrl( avatarUrls?: {
	'24'?: string;
	'48'?: string;
	'96'?: string;
} ): string | undefined {
	return avatarUrls?.[ '48' ] || avatarUrls?.[ '96' ] || avatarUrls?.[ '24' ];
}
