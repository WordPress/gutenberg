import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

// Other schemes, such as `javascript:` and `data:`, can run script when the
// link is opened, so they never resolve.
const SAFE_PROTOCOLS = [ 'http:', 'https:', 'mailto:', 'tel:' ];

/**
 * Resolves a link against a base URL, the way a browser resolves an `href`.
 *
 * @param url     The link, as stored in a block's attributes.
 * @param baseUrl The URL that relative links and hash links resolve against.
 * @return The absolute URL, or `undefined` when the link can't be resolved,
 *         such as a relative link with no base URL, or isn't safe to open.
 */
export function getResolvedUrl( url?: string, baseUrl?: string ) {
	if ( ! url ) {
		return undefined;
	}
	let resolved;
	try {
		resolved = new URL( url, baseUrl );
	} catch {
		return undefined;
	}
	return SAFE_PROTOCOLS.includes( resolved.protocol )
		? resolved.href
		: undefined;
}

/**
 * Resolves a link against the site's home URL. A page-relative link, such as
 * `#faq` or `./about`, depends on the page it's rendered on, which a block
 * doesn't know, so the home page stands in for it.
 *
 * @param url The link, as stored in a block's attributes.
 * @return The absolute URL, or `undefined` when the link can't be resolved.
 */
export function useResolvedUrl( url?: string ) {
	// An absolute URL resolves on its own. Only a relative link needs the
	// home URL, so only then does the hook subscribe to the site data.
	const needsBaseUrl = !! url && getResolvedUrl( url ) === undefined;
	const homeUrl = useSelect(
		( select ) =>
			needsBaseUrl
				? select( coreStore ).getEntityRecord< { home?: string } >(
						'root',
						'__unstableBase'
					)?.home
				: undefined,
		[ needsBaseUrl ]
	);
	// The home URL has no trailing slash, but the front end serves the home
	// page as a directory (`/blog/`), so a page-relative link such as
	// `./about` must resolve inside it.
	return getResolvedUrl( url, homeUrl && homeUrl.replace( /\/?$/, '/' ) );
}
