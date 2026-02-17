/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { safeDecodeURI } from '@wordpress/url';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useRemoteUrlData, isHashLink, isRelativePath } = unlock(
	blockEditorPrivateApis
);

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str - The string to capitalize
 * @return {string} Capitalized string
 */
function capitalize( str ) {
	return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

/**
 * Compute display URL - strips site URL if internal, shows full URL if external.
 *
 * @param {Object} options         - Parameters object
 * @param {string} options.linkUrl - The URL to process
 * @param {string} options.siteUrl - The WordPress site URL (falls back to window.location.origin)
 * @return {Object} Object with displayUrl and isExternal flag
 */
export function computeDisplayUrl( { linkUrl, siteUrl } = {} ) {
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
		// Use provided siteUrl or fall back to window.location.origin
		const siteDomain = siteUrl || window.location.origin;
		if ( parsedUrl.origin === siteDomain ) {
			// Show only the pathname (and search/hash if present)
			let path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
			// Remove trailing slash
			if ( path.endsWith( '/' ) && path.length > 1 ) {
				path = path.slice( 0, -1 );
			}
			displayUrl = path;
		} else {
			// Different origin - this is an external link
			isExternal = true;
		}
	} catch ( e ) {
		// URL parsing failed - this means it's likely a URL without a protocol (e.g., "www.example.com")
		// Since we already checked for relative paths and hash links above, treat as external
		isExternal = true;
	}

	return { displayUrl, isExternal };
}

/**
 * Compute badges for the link preview.
 *
 * @param {Object}  options                   - Options object
 * @param {string}  options.url               - Link URL
 * @param {string}  options.type              - Entity type (page, post, etc.)
 * @param {boolean} options.isExternal        - Whether link is external
 * @param {string}  options.entityStatus      - Entity status (publish, draft, etc.)
 * @param {boolean} options.hasBinding        - Whether link has entity binding
 * @param {boolean} options.isEntityAvailable - Whether bound entity exists
 * @return {Array} Array of badge objects with label and intent
 */
export function computeBadges( {
	url,
	type,
	isExternal,
	entityStatus,
	hasBinding,
	isEntityAvailable,
} ) {
	const badges = [];

	// Kind badge
	if ( url ) {
		if ( isExternal ) {
			badges.push( {
				label: __( 'External link' ),
				intent: 'default',
			} );
		} else if ( isHashLink( url ) ) {
			// Hash links should be detected before type check
			// because they're not entity links even if type is set
			badges.push( {
				label: __( 'Internal link' ),
				intent: 'default',
			} );
		} else if ( type && type !== 'custom' ) {
			// Show entity type badge (page, post, category, etc.)
			// but not 'custom' since that's just a manual link
			badges.push( { label: capitalize( type ), intent: 'default' } );
		} else {
			// Internal link (not external, not hash, not entity)
			badges.push( {
				label: __( 'Page' ),
				intent: 'default',
			} );
		}
	}

	// Status badge
	if ( hasBinding && ! isEntityAvailable ) {
		badges.push( {
			label: sprintf(
				/* translators: %s is the entity type (e.g., "page", "post", "category") */
				__( 'Missing %s' ),
				type
			),
			intent: 'error',
		} );
	} else if ( ! url ) {
		badges.push( { label: __( 'No link selected' ), intent: 'error' } );
	} else if ( entityStatus ) {
		const statusMap = {
			publish: { label: __( 'Published' ), intent: 'success' },
			future: { label: __( 'Scheduled' ), intent: 'warning' },
			draft: { label: __( 'Draft' ), intent: 'warning' },
			pending: { label: __( 'Pending' ), intent: 'warning' },
			private: { label: __( 'Private' ), intent: 'default' },
			trash: { label: __( 'Trash' ), intent: 'error' },
		};
		const badge = statusMap[ entityStatus ];
		if ( badge ) {
			badges.push( badge );
		}
	}

	return badges;
}

/**
 * Hook to compute link preview data for display.
 *
 * This hook takes raw link data and entity information and computes
 * presentation-ready preview data including formatted title, URL, and badges.
 *
 * @param {Object}  options                   - Options object
 * @param {string}  options.url               - Link URL
 * @param {string}  options.type              - Entity type (page, post, etc.)
 * @param {Object}  options.entityRecord      - Entity record
 * @param {boolean} options.hasBinding        - Whether link has entity binding
 * @param {boolean} options.isEntityAvailable - Whether bound entity exists
 * @return {Object} Preview data object with title, url, image, and badges
 */
export function useLinkPreview( {
	url,
	entityRecord,
	type,
	hasBinding,
	isEntityAvailable,
} ) {
	// Get the WordPress site URL from settings
	const siteUrl = useSelect( ( select ) => {
		const siteEntity = select( coreDataStore ).getEntityRecord(
			'root',
			'site'
		);
		return siteEntity?.url;
	}, [] );

	const title =
		entityRecord?.title?.rendered ||
		entityRecord?.title ||
		entityRecord?.name;

	// Fetch rich URL data if we don't have a title. Internal links should have passed a title.
	const { richData } = useRemoteUrlData( title ? null : url );

	// Compute display URL and external flag
	const { displayUrl, isExternal } = computeDisplayUrl( {
		linkUrl: url,
		siteUrl,
	} );

	const image = useSelect(
		( select ) => {
			// Only fetch for post-type entities with featured media
			if ( ! entityRecord?.featured_media ) {
				return null;
			}

			const { getEntityRecord } = select( coreDataStore );

			// Get the media entity to fetch the image URL
			const media = getEntityRecord(
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
