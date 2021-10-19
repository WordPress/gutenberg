/**
 * External dependencies
 */
import { startsWith, find, partialRight } from 'lodash';

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

/* eslint-disable jsdoc/no-undefined-types */
/**
 * Get the start and end boundaries of a given format from a rich text value.
 *
 *
 * @param {RichTextValue} value      the rich text value to interrogate.
 * @param {string}        format     the identifier for the target format (e.g. `core/link`, `core/bold`).
 * @param {number?}       startIndex optional startIndex to seek from.
 * @param {number?}       endIndex   optional endIndex to seek from.
 * @return {Object}	object containing start and end values for the given format.
 */
/* eslint-enable jsdoc/no-undefined-types */
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

	// Retrieve a *reference* to the target format object
	// at the initial index.
	const targetFormat = find( newFormats[ initialIndex ], {
		type: format.type,
	} );

	if ( ! targetFormat ) {
		return EMPTY_BOUNDARIES;
	}

	const index = newFormats[ initialIndex ].indexOf( targetFormat );

	// If not found...
	if ( index === -1 ) {
		return EMPTY_BOUNDARIES;
	}

	const walkingArgs = [ newFormats, initialIndex, targetFormat, index ];

	// Walk the startIndex "backwards" to the leading "edge" of the matching format.
	startIndex = walkToStart( ...walkingArgs );

	// Walk the endIndex "forwards" until the trailing "edge" of the matching format.
	endIndex = walkToEnd( ...walkingArgs );

	// Safe guard: start index cannot be less than 0
	startIndex = startIndex < 0 ? 0 : startIndex;

	// // Return the indicies of the "edges" as the boundaries.
	return {
		start: startIndex,
		end: endIndex,
	};
}

/**
 * Walks forwards/backwards towards the boundary of a given format within an
 * array of format objects. Returns the index of the boundary.
 *
 * @param {Array}  formats         the formats to search for the given format type.
 * @param {number} initialIndex    the starting index from which to walk.
 * @param {Object} targetFormatRef a reference to the format type object being sought.
 * @param {number} formatIndex     the index at which we expect the target format object to be.
 * @param {string} direction       either 'forwards' or 'backwards' to indicate the direction.
 * @return {number} the index of the boundary of the given format.
 */
function walkToBoundary(
	formats,
	initialIndex,
	targetFormatRef,
	formatIndex,
	direction
) {
	let index = initialIndex;

	const directions = {
		forwards: 1,
		backwards: -1,
	};

	const directionIncrement = directions[ direction ] || 1; // invalid direction arg default to forwards
	const inverseDirectionIncrement = directionIncrement * -1;

	while (
		formats[ index ] &&
		formats[ index ][ formatIndex ] === targetFormatRef
	) {
		// Increment/decrement in the direction of operation.
		index = index + directionIncrement;
	}

	// Restore by one in inverse direction of operation
	// to avoid out of bounds.
	index = index + inverseDirectionIncrement;

	return index;
}

const walkToStart = partialRight( walkToBoundary, 'backwards' );

const walkToEnd = partialRight( walkToBoundary, 'forwards' );
