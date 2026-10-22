import { __, sprintf } from '@wordpress/i18n';
import { safeDecodeURI } from '@wordpress/url';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore, type Attachment } from '@wordpress/core-data';
import { unlock } from '../lock-unlock';

/**
 * Helpers for a block that edits a link with the block editor's `LinkPicker`:
 * the preview it shows for the current link, and the search options for its
 * suggestions.
 */

const { useRemoteUrlData, isHashLink, isRelativePath } = unlock(
	blockEditorPrivateApis
);

interface SearchOptions {
	type: string;
	subtype?: string;
}

export interface SuggestionsQuery {
	preferTypes: ( SearchOptions | string )[];
	initialSuggestionsSearchOptions: SearchOptions & { perPage: number };
}

/**
 * Given the Link block's type attribute, return the query params for that one
 * entity type.
 *
 * @param type Link block's type attribute.
 * @param kind Link block's entity of kind (post-type|taxonomy)
 * @return Search query params.
 */
function getOwnTypeSearchOptions(
	type?: string,
	kind?: string
): SearchOptions {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type };
		case 'category':
			return { type: 'term', subtype: 'category' };
		case 'tag':
			return { type: 'term', subtype: 'post_tag' };
		case 'post_format':
			return { type: 'post-format' };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type };
			}
			// for custom link which has no type
			// always show pages as initial suggestions
			return { type: 'post', subtype: 'page' };
	}
}

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * @param type Link block's type attribute.
 * @param kind Link block's entity of kind (post-type|taxonomy)
 * @return Search query params.
 */
export function getSuggestionsQuery(
	type?: string,
	kind?: string
): SuggestionsQuery {
	const ownType = getOwnTypeSearchOptions( type, kind );

	return {
		preferTypes: [ ownType.subtype ? ownType : ownType.type ],
		initialSuggestionsSearchOptions: { ...ownType, perPage: 20 },
	};
}

/**
 * Capitalize the first letter of a string.
 *
 * @param str The string to capitalize
 * @return Capitalized string
 */
function capitalize( str: string ) {
	return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

/**
 * Check if a URL points to the site homepage.
 * Handles protocol (http/https) and trailing slash variations.
 * Does not match subdomains unless they are the site URL.
 *
 * @param url     The URL to check
 * @param homeUrl The WordPress site URL
 * @return True if url is the homepage
 */
export function isHomepage( url?: string | null, homeUrl?: string ) {
	if ( url === '/' ) {
		return true;
	}
	if ( ! url || ! homeUrl ) {
		return false;
	}
	try {
		const urlParsed = new URL( url, homeUrl );
		const homeParsed = new URL( homeUrl );

		// Same host, i.e. sub.homepage.com or homepage.com
		if ( urlParsed.hostname !== homeParsed.hostname ) {
			return false;
		}

		// Path must match site root (normalize trailing slash)
		const urlPath = urlParsed.pathname.replace( /\/$/, '' );
		const homePath = homeParsed.pathname.replace( /\/$/, '' );

		return urlPath === homePath;
	} catch {
		return false;
	}
}

/**
 * Compute display URL - strips site URL if internal, shows full URL if external.
 *
 * @param options         Parameters object
 * @param options.linkUrl The URL to process
 * @param options.homeUrl The WordPress site URL (required for internal/external detection)
 * @return Object with displayUrl and isExternal flag
 */
export function computeDisplayUrl( {
	linkUrl,
	homeUrl,
}: { linkUrl?: string | null; homeUrl?: string } = {} ) {
	if ( ! linkUrl ) {
		return { displayUrl: '', isExternal: false };
	}

	let displayUrl = safeDecodeURI( linkUrl );
	let isExternal = false;

	// Check hash links and relative paths first - these are always internal
	if ( isRelativePath( linkUrl ) || isHashLink( linkUrl ) ) {
		return { displayUrl, isExternal: false };
	}

	// Try to parse as a full URL to determine if it's actually external
	// This must happen before trusting the type attribute
	try {
		const parsedUrl = new URL( linkUrl );
		// Compare by host (not origin) so http/https to same site both count as internal
		const siteHost = new URL( homeUrl as string ).host;

		if ( parsedUrl.host === siteHost ) {
			// Show only the pathname (and search/hash if present)
			let path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
			// Remove trailing slash
			if ( path.endsWith( '/' ) && path.length > 1 ) {
				path = path.slice( 0, -1 );
			}
			displayUrl = path;
		} else {
			// Different host - this is an external link
			isExternal = true;
		}
	} catch {
		// URL parsing failed - treat as external (e.g. no homeUrl, or URL without protocol)
		isExternal = true;
	}

	return { displayUrl, isExternal };
}

export interface Badge {
	label: string;
	/** A `@wordpress/ui` `Badge` intent. */
	intent: 'none' | 'high' | 'low' | 'stable' | 'informational';
}

/**
 * Compute badges for the link preview.
 *
 * @param options                   Options object
 * @param options.url               Link URL
 * @param options.homeUrl           WordPress site URL (for homepage detection)
 * @param options.type              Entity type (page, post, etc.)
 * @param options.isExternal        Whether link is external
 * @param options.entityStatus      Entity status (publish, draft, etc.)
 * @param options.hasBinding        Whether link has entity binding
 * @param options.isEntityAvailable Whether bound entity exists
 * @return Array of badge objects with label and `@wordpress/ui` `Badge` intent
 */
export function computeBadges( {
	url,
	homeUrl,
	type,
	isExternal,
	entityStatus,
	hasBinding,
	isEntityAvailable,
}: {
	url?: string | null;
	homeUrl?: string;
	type?: string | null;
	isExternal?: boolean;
	entityStatus?: string;
	hasBinding?: boolean;
	isEntityAvailable?: boolean;
} ): Badge[] {
	const badges: Badge[] = [];
	// Kind badge
	if ( url ) {
		if ( isExternal ) {
			badges.push( {
				label: __( 'External link' ),
				intent: 'none',
			} );
		} else if ( isHashLink( url ) ) {
			// Hash links should be detected before type check
			// because they're not entity links even if type is set
			badges.push( {
				label: __( 'Internal link' ),
				intent: 'none',
			} );
		} else if ( isHomepage( url, homeUrl ) ) {
			badges.push( {
				label: __( 'Homepage' ),
				intent: 'none',
			} );
		} else if ( type && type !== 'custom' ) {
			// Show entity type badge (page, post, category, etc.)
			// but not 'custom' since that's just a manual link
			badges.push( { label: capitalize( type ), intent: 'none' } );
		} else {
			// Internal link (not external, not hash, not entity)
			badges.push( {
				label: __( 'Page' ),
				intent: 'none',
			} );
		}
	}

	// Status badge
	if ( hasBinding && ! isEntityAvailable ) {
		badges.push( {
			label: sprintf(
				/* translators: %s is the entity type (e.g., "page", "post", "category") */
				__( 'Missing %s' ),
				type as string
			),
			intent: 'high',
		} );
	} else if ( ! url ) {
		badges.push( { label: __( 'No link selected' ), intent: 'high' } );
	} else if ( entityStatus ) {
		const statusMap: Record< string, Badge > = {
			publish: { label: __( 'Published' ), intent: 'stable' },
			future: { label: __( 'Scheduled' ), intent: 'informational' },
			draft: { label: __( 'Draft' ), intent: 'low' },
			pending: { label: __( 'Pending' ), intent: 'low' },
			private: { label: __( 'Private' ), intent: 'informational' },
			trash: { label: __( 'Trashed' ), intent: 'high' },
		};
		const badge = statusMap[ entityStatus ];
		if ( badge ) {
			badges.push( badge );
		}
	}

	return badges;
}

/**
 * The parts of an entity record the link preview reads. Posts and pages
 * expose `title` as a `{ raw, rendered }` object; terms use a plain `name`.
 */
export interface LinkPreviewEntityRecord {
	title?: string | { raw?: string; rendered?: string };
	name?: string;
	status?: string;
	featured_media?: number;
}

/**
 * Returns an entity record's display title: the rendered title, "(no title)"
 * for an untitled entity, or the record's name.
 *
 * @param entityRecord The entity record.
 * @return The display title.
 */
function getEntityTitle( entityRecord?: LinkPreviewEntityRecord | null ) {
	const title = entityRecord?.title;

	// Some entity types use a plain string for the title.
	if ( typeof title === 'string' ) {
		return title;
	}

	// Posts and pages expose `title` as a { raw, rendered } object.
	if ( title && 'rendered' in title ) {
		return title.rendered || __( '(no title)' );
	}

	return entityRecord?.name;
}

/**
 * Hook to compute link preview data for display.
 *
 * This hook takes raw link data and entity information and computes
 * presentation-ready preview data including formatted title, URL, and badges.
 *
 * @param options                   Options object
 * @param options.url               Link URL
 * @param options.type              Entity type (page, post, etc.)
 * @param options.entityRecord      Entity record
 * @param options.hasBinding        Whether link has entity binding
 * @param options.isEntityAvailable Whether bound entity exists
 * @return Preview data object with title, url, image, and badges
 */
export function useLinkPreview( {
	url,
	entityRecord,
	type,
	hasBinding,
	isEntityAvailable,
}: {
	url?: string | null;
	entityRecord?: LinkPreviewEntityRecord | null;
	type?: string | null;
	hasBinding?: boolean;
	isEntityAvailable?: boolean;
} ) {
	// Get the WordPress homepage URL from settings
	const homeUrl = useSelect( ( select ) => {
		return select( coreDataStore ).getEntityRecord< { home?: string } >(
			'root',
			'__unstableBase'
		)?.home;
	}, [] );

	const title = getEntityTitle( entityRecord );

	// Fetch rich URL data if we don't have a title. Internal links should have passed a title.
	const { richData } = useRemoteUrlData( title ? null : url );

	// Compute display URL and external flag
	const { displayUrl, isExternal } = computeDisplayUrl( {
		linkUrl: url,
		homeUrl,
	} );

	const image = useSelect(
		( select ) => {
			// Only fetch for post-type entities with featured media
			if ( ! entityRecord?.featured_media ) {
				return null;
			}

			const { getEntityRecord } = select( coreDataStore );

			// Get the media entity to fetch the image URL
			const media = getEntityRecord< Attachment >(
				'postType',
				'attachment',
				entityRecord.featured_media
			);

			// Return the thumbnail or medium size URL, fallback to source_url
			return (
				media?.media_details?.sizes?.thumbnail?.source_url ||
				media?.media_details?.sizes?.medium?.source_url ||
				media?.source_url ||
				null
			);
		},
		[ entityRecord?.featured_media ]
	);

	// Compute badges
	const badges = computeBadges( {
		url,
		homeUrl,
		type,
		isExternal,
		entityStatus: entityRecord?.status,
		hasBinding,
		isEntityAvailable,
	} );

	// Get display title - use provided title, fallback to rich data, or URL
	const displayTitle = url
		? title || richData?.title || safeDecodeURI( url )
		: __( 'Add link' );

	return {
		title: displayTitle,
		url: displayUrl,
		image,
		badges,
	};
}
