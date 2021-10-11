/**
 * External dependencies
 */
import { startsWith, find } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getProtocol,
	isValidProtocol,
	getAuthority,
	isValidAuthority,
	getPath,
	isValidPath,
	getQueryString,
	isValidQueryString,
	getFragment,
	isValidFragment,
} from '@wordpress/url';

/**
 * Check for issues with the provided href.
 *
 * @param {string} href The href.
 *
 * @return {boolean} Is the href invalid?
 */
export function isValidHref( href ) {
	if ( ! href ) {
		return false;
	}

	const trimmedHref = href.trim();

	if ( ! trimmedHref ) {
		return false;
	}

	// Does the href start with something that looks like a URL protocol?
	if ( /^\S+:/.test( trimmedHref ) ) {
		const protocol = getProtocol( trimmedHref );
		if ( ! isValidProtocol( protocol ) ) {
			return false;
		}

		// Add some extra checks for http(s) URIs, since these are the most common use-case.
		// This ensures URIs with an http protocol have exactly two forward slashes following the protocol.
		if (
			startsWith( protocol, 'http' ) &&
			! /^https?:\/\/[^\/\s]/i.test( trimmedHref )
		) {
			return false;
		}

		const authority = getAuthority( trimmedHref );
		if ( ! isValidAuthority( authority ) ) {
			return false;
		}

		const path = getPath( trimmedHref );
		if ( path && ! isValidPath( path ) ) {
			return false;
		}

		const queryString = getQueryString( trimmedHref );
		if ( queryString && ! isValidQueryString( queryString ) ) {
			return false;
		}

		const fragment = getFragment( trimmedHref );
		if ( fragment && ! isValidFragment( fragment ) ) {
			return false;
		}
	}

	// Validate anchor links.
	if ( startsWith( trimmedHref, '#' ) && ! isValidFragment( trimmedHref ) ) {
		return false;
	}

	return true;
}

/**
 * Generates the format object that will be applied to the link text.
 *
 * @param {Object}  options
 * @param {string}  options.url              The href of the link.
 * @param {string}  options.type             The type of the link.
 * @param {string}  options.id               The ID of the link.
 * @param {boolean} options.opensInNewWindow Whether this link will open in a new window.
 *
 * @return {Object} The final format object.
 */
export function createLinkFormat( { url, type, id, opensInNewWindow } ) {
	const format = {
		type: 'core/link',
		attributes: {
			url,
		},
	};

	if ( type ) format.attributes.type = type;
	if ( id ) format.attributes.id = id;

	if ( opensInNewWindow ) {
		format.attributes.target = '_blank';
		format.attributes.rel = 'noreferrer noopener';
	}

	return format;
}

export function getFormatBoundary(
	value,
	format,
	startIndex = value.start,
	endIndex = value.end
) {
	const EMPTY_BOUNDARIES = {
		start: null,
		end: null,
	};

	const { formats } = value;

	if ( ! formats ) {
		return EMPTY_BOUNDARIES;
	}

	const newFormats = formats.slice();

	// If there are no matching formats *at* the reputed "end"
	// then we are already at the end of the format.
	// This is because endIndex is always +1 more than the
	// end of the format itself.
	const isIndexAtEnd = ! find( newFormats[ endIndex ], {
		type: format.type,
	} );

	// Account for endindex being +1 (see above).
	const initialIndex = isIndexAtEnd ? startIndex - 1 : startIndex;

	// Retrieve a reference to the target format object
	// at the initial index.
	const targetFormat = getTargetFormatObjectReference(
		newFormats,
		initialIndex,
		format.type
	);

	if ( ! targetFormat ) {
		return EMPTY_BOUNDARIES;
	}

	const index = newFormats[ initialIndex ].indexOf( targetFormat );

	// If not found...
	if ( index === -1 ) {
		return EMPTY_BOUNDARIES;
	}

	// Walk the startIndex "backwards" to the leading "edge" of the matching format.
	startIndex = walkToBoundary(
		newFormats,
		initialIndex,
		targetFormat,
		index,
		'backwards'
	);

	// Walk the endIndex "forwards" until the trailing "edge" of the matching format.
	endIndex = walkToBoundary(
		newFormats,
		initialIndex,
		targetFormat,
		index,
		'forwards'
	);

	// Safe guard: start index cannot be less than 0
	startIndex = startIndex < 0 ? 0 : startIndex;

	// // Return the indicies of the "edges" as the boundaries.
	return {
		start: startIndex,
		end: endIndex,
	};
}

// Retrieve a reference to the target format object
// at the initial index.
function getTargetFormatObjectReference( formats, index, type ) {
	return find( formats[ index ], {
		type,
	} );
}

function walkToBoundary( formats, index, initFormat, formatIndex, direction ) {
	while (
		formats[ index ] &&
		formats[ index ][ formatIndex ] === initFormat
	) {
		if ( direction === 'forwards' ) {
			index++;
		} else {
			index--;
		}
	}

	// Restore by one to avoid out of bounds.
	if ( direction === 'backwards' ) {
		index++;
	} else {
		index--;
	}

	return index;
}
