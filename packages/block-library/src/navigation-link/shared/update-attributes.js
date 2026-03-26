/**
 * WordPress dependencies
 */
import { escapeHTML } from '@wordpress/escape-html';
import { safeDecodeURI, getPath } from '@wordpress/url';

/**
 * Determines if an entity link should be severed based on URL changes.
 *
 * @param {string} originalUrl - The original URL
 * @param {string} newUrl      - The new URL
 * @return {boolean} True if the entity link should be severed
 */
const shouldSeverEntityLink = ( originalUrl, newUrl ) => {
	if ( ! originalUrl || ! newUrl ) {
		return false;
	}

	const normalizePath = ( path ) => {
		if ( ! path ) {
			return '';
		}
		return path.replace( /\/+$/, '' ); // Remove trailing slashes
	};

	// Helper function to create URL objects with proper base handling
	const createUrlObject = ( url, baseUrl = null ) => {
		try {
			// Always provide a base URL - it will be ignored for absolute URLs
			// Use window.location.origin in browser, fallback for Node/tests
			const base =
				baseUrl ||
				( typeof window !== 'undefined'
					? window.location.origin
					: 'https://wordpress.org' );
			return new URL( url, base );
		} catch ( error ) {
			// If URL construction still fails, it's likely an invalid URL
			// and we should sever the entity link
			return null;
		}
	};

	const originalUrlObj = createUrlObject( originalUrl );
	if ( ! originalUrlObj ) {
		return true;
	}

	const newUrlObj = createUrlObject( newUrl, originalUrl );
	if ( ! newUrlObj ) {
		return true;
	}

	// Move these declarations here, after the null checks
	const originalHostname = originalUrlObj.hostname;
	const newHostname = newUrlObj.hostname;
	const originalPath = normalizePath( getPath( originalUrlObj.toString() ) );
	const newPath = normalizePath( getPath( newUrlObj.toString() ) );

	// If hostname or path changed, sever the entity link
	if ( originalHostname !== newHostname || originalPath !== newPath ) {
		return true;
	}

	// Special handling for plain permalinks (query string post IDs)
	const originalP = originalUrlObj.searchParams.get( 'p' );
	const newP = newUrlObj.searchParams.get( 'p' );

	// If both are plain permalinks (with ?p= or ?page_id=), compare the IDs
	if ( originalP && newP && originalP !== newP ) {
		return true;
	}

	const originalPageId = originalUrlObj.searchParams.get( 'page_id' );
	const newPageId = newUrlObj.searchParams.get( 'page_id' );

	if ( originalPageId && newPageId && originalPageId !== newPageId ) {
		return true;
	}
	// If switching between ?p= and ?page_id=, or one is missing, sever
	if ( ( originalP && newPageId ) || ( originalPageId && newP ) ) {
		return true;
	}

	// If only query string or fragment changed, preserve the entity link
	return false;
};

/**
 * @typedef {'post-type'|'custom'|'taxonomy'|'post-type-archive'} WPNavigationLinkKind
 */
/**
 * Navigation Link Block Attributes
 *
 * @typedef {Object} WPNavigationLinkBlockAttributes
 *
 * @property {string}               [label]         Link text.
 * @property {WPNavigationLinkKind} [kind]          Kind is used to differentiate between term and post ids to check post draft status.
 * @property {string}               [type]          The type such as post, page, tag, category and other custom types.
 * @property {string}               [rel]           The relationship of the linked URL.
 * @property {number}               [id]            A post or term id.
 * @property {boolean}              [opensInNewTab] Sets link target to _blank when true.
 * @property {string}               [url]           Link href.
 * @property {string}               [title]         Link title attribute.
 */
/**
 * Link Control onChange handler that updates block attributes when a setting is changed.
 *
 * @param {Object}                          updatedValue    New block attributes to update.
 * @param {Function}                        setAttributes   Block attribute update function.
 * @param {WPNavigationLinkBlockAttributes} blockAttributes Current block attributes.
 */

export const updateAttributes = (
	updatedValue = {},
	setAttributes,
	blockAttributes = {}
) => {
	const {
		label: originalLabel = '',
		kind: originalKind = '',
		type: originalType = '',
	} = blockAttributes;

	const {
		title: newLabel = '', // the title of any provided Post.
		label: newLabelFromLabel = '', // alternative to title
		url: newUrl,
		opensInNewTab,
		id: newID,
		kind: newKind = originalKind,
		type: newType = originalType,
	} = updatedValue;

	// Use title if provided, otherwise fall back to label
	const finalNewLabel = newLabel || newLabelFromLabel;

	const newLabelWithoutHttp = finalNewLabel.replace( /http(s?):\/\//gi, '' );
	const newUrlWithoutHttp = newUrl?.replace( /http(s?):\/\//gi, '' ) ?? '';

	const useNewLabel =
		finalNewLabel &&
		finalNewLabel !== originalLabel &&
		// LinkControl without the title field relies
		// on the check below. Specifically, it assumes that
		// the URL is the same as a title.
		// This logic a) looks suspicious and b) should really
		// live in the LinkControl and not here. It's a great
		// candidate for future refactoring.
		newLabelWithoutHttp !== newUrlWithoutHttp;

	// Unfortunately this causes the escaping model to be inverted.
	// The escaped content is stored in the block attributes (and ultimately in the database),
	// and then the raw data is "recovered" when outputting into the DOM.
	// It would be preferable to store the **raw** data in the block attributes and escape it in JS.
	// Why? Because there isn't one way to escape data. Depending on the context, you need to do
	// different transforms. It doesn't make sense to me to choose one of them for the purposes of storage.
	// See also:
	// - https://github.com/WordPress/gutenberg/pull/41063
	// - https://github.com/WordPress/gutenberg/pull/18617.
	const label = useNewLabel
		? escapeHTML( finalNewLabel )
		: originalLabel || escapeHTML( newUrlWithoutHttp );

	// In https://github.com/WordPress/gutenberg/pull/24670 we decided to use "tag" in favor of "post_tag"
	const type = newType === 'post_tag' ? 'tag' : newType.replace( '-', '_' );

	const isBuiltInType =
		[ 'post', 'page', 'tag', 'category' ].indexOf( type ) > -1;

	const isCustomLink =
		( ! newKind && ! isBuiltInType ) || newKind === 'custom';
	const kind = isCustomLink ? 'custom' : newKind;

	const attributes = {
		// Passed `url` may already be encoded. To prevent double encoding, decodeURI is executed to revert to the original string.
		...( newUrl !== undefined
			? { url: newUrl ? encodeURI( safeDecodeURI( newUrl ) ) : newUrl }
			: {} ),
		...( label && { label } ),
		...( undefined !== opensInNewTab && { opensInNewTab } ),
		...( kind && { kind } ),
		...( type && type !== 'URL' && { type } ),
	};

	// If the block's id is set then the menu item is linking to an entity.
	// Therefore, if the URL is set but a new ID is not provided, check if
	// the entity link should be severed based on URL changes.
	if ( newUrl && ! newID && blockAttributes.id ) {
		const shouldSever = shouldSeverEntityLink(
			blockAttributes.url,
			newUrl
		);

		if ( shouldSever ) {
			attributes.id = undefined; // explicitly "unset" the ID.
			// When URL is manually changed in a way that severs the entity link,
			// update kind and type to "custom" to indicate this is now a custom link.
			attributes.kind = 'custom';
			attributes.type = 'custom';
		}
	} else if ( newID && Number.isInteger( newID ) ) {
		attributes.id = newID;
	} else if ( blockAttributes.id ) {
		// If we have an existing ID and no URL change, ensure kind and type are preserved
		attributes.kind = kind;
		attributes.type = type;
	}

	setAttributes( attributes );

	// Return metadata about the final state for binding decisions.
	// We need to distinguish between:
	// 1. Property not set in attributes (use blockAttributes fallback)
	// 2. Property explicitly set to undefined (means "remove this")
	// Using 'in' operator checks if property exists, even if undefined.
	// This is critical for severing: attributes.id = undefined means "remove the ID",
	// not "keep the old ID from blockAttributes".
	const finalId = 'id' in attributes ? attributes.id : blockAttributes.id;
	const finalKind =
		'kind' in attributes ? attributes.kind : blockAttributes.kind;

	return {
		isEntityLink: !! finalId && finalKind !== 'custom',
		attributes, // Return the computed attributes object
	};
};
