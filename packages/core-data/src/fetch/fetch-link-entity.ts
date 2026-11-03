import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import type { SearchResult } from './__experimental-fetch-link-suggestions';

export type SiteUrls = {
	/**
	 * The site's home address, where its front end is.
	 */
	homeUrl?: string;
	/**
	 * The site's WordPress address, which can differ from the home address.
	 */
	siteUrl?: string;
};

type LinkRecord = {
	id: number;
	link: string;
	title?: { rendered: string };
	name?: string;
};

// The collections a link can be bound to, the same ones the link search finds.
const COLLECTIONS = [
	{ path: '/wp/v2/pages', type: 'page', kind: 'post-type' },
	{ path: '/wp/v2/posts', type: 'post', kind: 'post-type' },
	{ path: '/wp/v2/categories', type: 'category', kind: 'taxonomy' },
	{ path: '/wp/v2/tags', type: 'post_tag', kind: 'taxonomy' },
];

// The plain permalinks that name a post by its id.
const PLAIN_PERMALINKS = {
	page_id: COLLECTIONS[ 0 ],
	p: COLLECTIONS[ 1 ],
};

/**
 * Parses a URL that points at this site.
 *
 * @param url      A URL, or a path relative to the site.
 * @param siteUrls The site's addresses.
 * @return The parsed URL, or `null` when it points elsewhere.
 */
function parseSiteUrl( url: string, siteUrls: SiteUrls ): URL | null {
	const bases = [ siteUrls.homeUrl, siteUrls.siteUrl ].flatMap( ( base ) => {
		try {
			return base ? [ new URL( base ) ] : [];
		} catch {
			return [];
		}
	} );
	if ( ! bases.length ) {
		return null;
	}

	// Only an absolute URL or a root-relative path can be on this site. A
	// protocol-relative `//host/path` is a URL on any host.
	const isRootRelative = url.startsWith( '/' ) && ! url.startsWith( '//' );
	if ( ! isRootRelative && ! /^https?:\/\//i.test( url ) ) {
		return null;
	}

	let parsed: URL;
	try {
		parsed = new URL( url, bases[ 0 ] );
	} catch {
		return null;
	}

	const isOnSite = bases.some( ( base ) => {
		const basePath = base.pathname.replace( /\/$/, '' );
		return (
			parsed.host === base.host &&
			( parsed.pathname === basePath ||
				parsed.pathname.startsWith( `${ basePath }/` ) )
		);
	} );
	return isOnSite ? parsed : null;
}

/**
 * Reduces a URL to its host and path, so that the two protocols and a trailing
 * slash compare equal.
 *
 * @param url The URL.
 */
function comparable( url: string ) {
	try {
		const { host, pathname } = new URL( url );
		return `${ host }${ pathname.replace( /\/$/, '' ) }`;
	} catch {
		return url;
	}
}

/**
 * Turns a REST record into a link suggestion.
 *
 * @param record     The post or term.
 * @param collection Where it came from.
 */
function toResult(
	record: LinkRecord,
	collection: ( typeof COLLECTIONS )[ number ]
): SearchResult {
	return {
		id: record.id,
		url: record.link,
		title: decodeEntities( record.title?.rendered ?? record.name ?? '' ),
		type: collection.type,
		kind: collection.kind,
	};
}

/**
 * Finds the post or term on this site that a URL links to, so that a pasted or
 * typed URL can be bound like a link picked from the search results.
 *
 * It makes no request for a URL that isn't on this site. It finds nothing for a
 * URL with a query or an anchor, since a bound link takes the URL of what it's
 * bound to and would drop them, except for a plain permalink like `?page_id=2`.
 *
 * @param url      A URL, or a path relative to the site.
 * @param siteUrls The site's home and WordPress addresses.
 * @return What the URL links to, or `null` when nothing matches.
 */
export default async function fetchLinkEntity(
	url: string,
	siteUrls: SiteUrls
): Promise< SearchResult | null > {
	const parsed = parseSiteUrl( url, siteUrls );
	if ( ! parsed || parsed.hash ) {
		return null;
	}

	try {
		const params = [ ...parsed.searchParams ];
		if ( params.length ) {
			const [ [ name, id ] ] = params;
			const collection =
				params.length === 1 && /^\d+$/.test( id )
					? PLAIN_PERMALINKS[ name as keyof typeof PLAIN_PERMALINKS ]
					: undefined;
			if ( ! collection ) {
				return null;
			}
			const record = await apiFetch< LinkRecord >( {
				path: addQueryArgs( `${ collection.path }/${ id }`, {
					_fields: 'id,link,title',
				} ),
			} );
			return toResult( record, collection );
		}

		const slug = parsed.pathname.split( '/' ).filter( Boolean ).pop();
		if ( ! slug ) {
			return null;
		}

		const target = comparable( parsed.href );
		const matches = await Promise.all(
			COLLECTIONS.map( async ( collection ) => {
				const records = await apiFetch< LinkRecord[] >( {
					path: addQueryArgs( collection.path, {
						slug,
						_fields: 'id,link,title,name',
					} ),
				} );
				const record = records.find(
					( { link } ) => comparable( link ) === target
				);
				return record ? toResult( record, collection ) : null;
			} )
		);
		return matches.find( Boolean ) ?? null;
	} catch {
		// A failed lookup leaves the link unbound, as it would be without one.
		return null;
	}
}
