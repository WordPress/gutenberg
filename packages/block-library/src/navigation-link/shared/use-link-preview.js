/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { safeDecodeURI } from '@wordpress/url';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useRemoteUrlData } = unlock( blockEditorPrivateApis );

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
 * @param {string} url - The URL to process
 * @return {Object} Object with displayUrl and isExternal flag
 */
function computeDisplayUrl( url ) {
	if ( ! url ) {
		return { displayUrl: '', isExternal: false };
	}

	let displayUrl = safeDecodeURI( url );
	let isExternal = false;

	try {
		const linkUrl = new URL( url );
		const siteUrl = window.location.origin;
		if ( linkUrl.origin === siteUrl ) {
			// Show only the pathname (and search/hash if present)
			let path = linkUrl.pathname + linkUrl.search + linkUrl.hash;
			// Remove trailing slash
			if ( path.endsWith( '/' ) && path.length > 1 ) {
				path = path.slice( 0, -1 );
			}
			displayUrl = path;
		} else {
			isExternal = true;
		}
	} catch ( e ) {
		// If URL parsing fails, use the original URL
		displayUrl = safeDecodeURI( url );
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
function computeBadges( {
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
		} else if ( type ) {
			badges.push( { label: capitalize( type ), intent: 'default' } );
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
 * @param {string}  options.entityStatus      - Entity status (publish, draft, etc.)
 * @param {boolean} options.hasBinding        - Whether link has entity binding
 * @param {boolean} options.isEntityAvailable - Whether bound entity exists
 * @return {Object} Preview data object with title, url, image, and badges
 */
export function useLinkPreview( {
	url,
	entityRecord,
	type,
	entityStatus,
	hasBinding,
	isEntityAvailable,
} ) {
	const title =
		entityRecord?.title?.rendered ||
		entityRecord?.title ||
		entityRecord?.name;

	// Fetch rich URL data if we don't have a title. Internal links should have passed a title.
	const { richData } = useRemoteUrlData( title ? null : url );

	// Compute display URL and external flag
	const { displayUrl, isExternal } = computeDisplayUrl( url );

	const image = useSelect(
		( select ) => {
			// Only fetch for post-type entities with featured media
			if ( ! entityRecord?.featured_media ) {
				return null;
			}

			const { getEntityRecord } = select( coreStore );

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
		entityStatus,
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
