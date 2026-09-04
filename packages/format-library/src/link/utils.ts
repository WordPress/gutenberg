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
import type { RichTextValue, RichTextFormat } from '@wordpress/rich-text';
import type { LinkFormat, LinkFormatOptions } from '../types';
/**
 * Check for issues with the provided href.
 *
 * @param href The href.
 *
 * @return Is the href invalid?
 */
export function isValidHref( href: string ): boolean {
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
		if ( ! protocol || ! isValidProtocol( protocol ) ) {
			return false;
		}

		// Add some extra checks for http(s) URIs, since these are the most common use-case.
		// This ensures URIs with an http protocol have exactly two forward slashes following the protocol.
		if (
			protocol.startsWith( 'http' ) &&
			! /^https?:\/\/[^\/\s]/i.test( trimmedHref )
		) {
			return false;
		}

		const authority = getAuthority( trimmedHref );
		if ( ! authority || ! isValidAuthority( authority ) ) {
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
	if ( trimmedHref.startsWith( '#' ) && ! isValidFragment( trimmedHref ) ) {
		return false;
	}

	return true;
}

/**
 * Generates the format object that will be applied to the link text.
 *
 * @param options
 * @param options.url              The href of the link.
 * @param options.type             The type of the link.
 * @param options.id               The ID of the link.
 * @param options.opensInNewWindow Whether this link will open in a new window.
 * @param options.nofollow         Whether this link is marked as no follow relationship.
 * @param options.cssClasses       The CSS classes to apply to the link.
 * @return The final format object.
 */
export function createLinkFormat( {
	url,
	type,
	id,
	opensInNewWindow,
	nofollow,
	cssClasses,
}: LinkFormatOptions ): LinkFormat {
	const format: LinkFormat = {
		type: 'core/link',
		attributes: {
			url,
		},
	};

	if ( type ) {
		format.attributes.type = type;
	}
	if ( id ) {
		format.attributes.id = id;
	}

	if ( opensInNewWindow ) {
		format.attributes.target = '_blank';
		format.attributes.rel = format.attributes.rel
			? format.attributes.rel + ' noopener'
			: 'noopener';
	}

	if ( nofollow ) {
		format.attributes.rel = format.attributes.rel
			? format.attributes.rel + ' nofollow'
			: 'nofollow';
	}

	const trimmedCssClasses = cssClasses?.trim();

	if ( trimmedCssClasses?.length ) {
		format.attributes.class = trimmedCssClasses;
	}

	return format;
}

/**
 *
 * Get the start and end boundaries of a given format from a rich text value.
 *
 * @param value      the rich text value to interrogate.
 * @param format     the target format object, identified by its `type` (e.g.
 *                   `core/link`, `core/bold`).
 * @param startIndex optional startIndex to seek from.
 * @param endIndex   optional endIndex to seek from.
 * @return object containing start and end values for the given format.
 */
export function getFormatBoundary(
	value: RichTextValue,
	format: RichTextFormat,
	startIndex: number = value.start,
	endIndex: number = value.end
): {
	start: number | undefined;
	end: number | undefined;
} {
	const EMPTY_BOUNDARIES = {
		start: undefined,
		end: undefined,
	};

	const { formats } = value;
	let targetFormat;
	let initialIndex;

	if ( ! formats?.length ) {
		return EMPTY_BOUNDARIES;
	}

	// Clone formats to avoid modifying source formats.
	const newFormats = formats.slice();

	const formatAtStart = newFormats[ startIndex ]?.find(
		( { type } ) => type === format.type
	);

	const formatAtEnd = newFormats[ endIndex ]?.find(
		( { type } ) => type === format.type
	);

	const formatAtEndMinusOne = newFormats[ endIndex - 1 ]?.find(
		( { type } ) => type === format.type
	);

	if ( !! formatAtStart ) {
		// Set values to conform to "start"
		targetFormat = formatAtStart;
		initialIndex = startIndex;
	} else if ( !! formatAtEnd ) {
		// Set values to conform to "end"
		targetFormat = formatAtEnd;
		initialIndex = endIndex;
	} else if ( !! formatAtEndMinusOne ) {
		// This is an edge case which will occur if you create a format, then place
		// the caret just before the format and hit the back ARROW key. The resulting
		// value object will have start and end +1 beyond the edge of the format boundary.
		targetFormat = formatAtEndMinusOne;
		initialIndex = endIndex - 1;
	} else {
		return EMPTY_BOUNDARIES;
	}

	const index = newFormats[ initialIndex ].indexOf( targetFormat );

	// Walk the startIndex "backwards" to the leading "edge" of the matching format.
	startIndex = walkToStart( newFormats, initialIndex, targetFormat, index );

	// Walk the endIndex "forwards" until the trailing "edge" of the matching format.
	endIndex = walkToEnd( newFormats, initialIndex, targetFormat, index );

	// Safe guard: start index cannot be less than 0.
	startIndex = startIndex < 0 ? 0 : startIndex;

	// Return the indices of the "edges" as the boundaries.
	// walkToEnd returns the last index that has the format (e.g. 10),
	// but rich-text APIs like applyFormat and slice expect the end to be
	// one position past the last character (e.g. 11), just like
	// String.prototype.slice. Adding 1 here so consumers don't have to.
	return {
		start: startIndex,
		end: endIndex + 1,
	};
}

/**
 * Walks forwards/backwards towards the boundary of a given format within an
 * array of format objects. Returns the index of the boundary.
 *
 * @param formats         the formats to search for the given format type.
 * @param initialIndex    the starting index from which to walk.
 * @param targetFormatRef a reference to the format type object being sought.
 * @param formatIndex     the index at which we expect the target format object to be.
 * @param direction       either 'forwards' or 'backwards' to indicate the direction.
 * @return  the index of the boundary of the given format.
 */
function walkToBoundary(
	formats: RichTextFormat[][],
	initialIndex: number,
	targetFormatRef: RichTextFormat,
	formatIndex: number,
	direction: 'forwards' | 'backwards'
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

type WalkFn = (
	formats: RichTextFormat[][],
	initialIndex: number,
	targetFormatRef: RichTextFormat,
	formatIndex: number
) => ReturnType< typeof walkToBoundary >;

const walkToStart: WalkFn = ( ...args ) =>
	walkToBoundary( ...args, 'backwards' );
const walkToEnd: WalkFn = ( ...args ) => walkToBoundary( ...args, 'forwards' );
