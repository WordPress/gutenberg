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
			protocol.startsWith( 'http' ) &&
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
	if ( trimmedHref.startsWith( '#' ) && ! isValidFragment( trimmedHref ) ) {
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
 * @param {boolean} options.nofollow         Whether this link is marked as no follow relationship.
 * @param {string}  options.cssClasses       The CSS classes to apply to the link.
 * @return {Object} The final format object.
 */
export function createLinkFormat( {
	url,
	type,
	id,
	opensInNewWindow,
	nofollow,
	cssClasses,
} ) {
	const format = {
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
 * @typedef {import('@wordpress/rich-text').RichTextValue} RichTextValue
 *
 * Get the start and end boundaries of a given format from a rich text value.
 *
 * @param {RichTextValue} value      the rich text value to interrogate.
 * @param {string}        format     the identifier for the target format (e.g. `core/link`, `core/bold`).
 * @param {number?}       startIndex optional startIndex to seek from.
 * @param {number?}       endIndex   optional endIndex to seek from.
 * @return {Object}	object containing start and end values for the given format.
 */
export function getFormatBoundary(
	value,
	format,
	startIndex = value.start,
	endIndex = value.end
) {
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

	const walkingArgs = [ newFormats, initialIndex, targetFormat, index ];

	// Walk the startIndex "backwards" to the leading "edge" of the matching format.
	startIndex = walkToStart( ...walkingArgs );

	// Walk the endIndex "forwards" until the trailing "edge" of the matching format.
	endIndex = walkToEnd( ...walkingArgs );

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

const partialRight =
	( fn, ...partialArgs ) =>
	( ...args ) =>
		fn( ...args, ...partialArgs );

const walkToStart = partialRight( walkToBoundary, 'backwards' );

const walkToEnd = partialRight( walkToBoundary, 'forwards' );

/**
 * @typedef {import('@wordpress/rich-text').RichTextValue} RichTextValue
 */

/**
 * Whether the value includes inline object replacements such as images.
 *
 * @param {RichTextValue} value The value to check.
 * @return {boolean} True when inline replacements exist.
 */
export function hasInlineReplacements( value ) {
	return value.replacements?.some( Boolean ) ?? false;
}

/**
 * @param {RichTextValue} value The rich text value to parse.
 * @return {Array<{ type: 'text', content: string } | { type: 'replacement', replacement: *, format: * }>} Segments.
 */
function getLinkContentSegments( value ) {
	const { text, formats, replacements } = value;
	const segments = [];
	let textBuffer = '';

	for ( let index = 0; index < text.length; index++ ) {
		if ( replacements[ index ] ) {
			if ( textBuffer ) {
				segments.push( { type: 'text', content: textBuffer } );
				textBuffer = '';
			}

			segments.push( {
				type: 'replacement',
				replacement: replacements[ index ],
				format: formats[ index ],
				character: text[ index ],
			} );
			continue;
		}

		textBuffer += text[ index ];
	}

	if ( textBuffer ) {
		segments.push( { type: 'text', content: textBuffer } );
	}

	return segments;
}

/**
 * Builds a RichTextValue from editable link title text while preserving inline
 * object replacements within the original linked content.
 *
 * @param {RichTextValue} sourceValue  The linked rich text slice.
 * @param {string}        displayTitle The title shown in the Link UI.
 * @return {Pick<RichTextValue, 'text' | 'formats' | 'replacements'>} The rebuilt value.
 */
export function createLinkTextValueFromDisplayTitle(
	sourceValue,
	displayTitle
) {
	const { formats, replacements, text } = sourceValue;

	if ( ! hasInlineReplacements( sourceValue ) ) {
		return {
			text: displayTitle,
			formats: [],
			replacements: [],
		};
	}

	const segments = getLinkContentSegments( sourceValue );
	const textSegments = segments.filter(
		( segment ) => segment.type === 'text'
	);
	const originalDisplay = textSegments
		.map( ( segment ) => segment.content )
		.join( '' );

	if ( displayTitle === originalDisplay ) {
		return {
			text,
			formats,
			replacements,
		};
	}

	if ( originalDisplay.length === 0 && displayTitle.length > 0 ) {
		const prependFormats = Array( displayTitle.length );
		const prependReplacements = Array( displayTitle.length );

		return {
			text: displayTitle + text,
			formats: prependFormats.concat( formats ),
			replacements: prependReplacements.concat( replacements ),
		};
	}

	const firstSegment = segments[ 0 ];
	const trailingText = textSegments.at( -1 )?.content ?? '';
	let updatedLeadingText = displayTitle;
	let updatedTrailingText = '';

	if ( textSegments.length > 1 ) {
		updatedTrailingText = trailingText;
		updatedLeadingText = displayTitle.slice(
			0,
			displayTitle.length - trailingText.length
		);
	} else if ( firstSegment.type === 'replacement' ) {
		updatedLeadingText = '';
		updatedTrailingText = displayTitle;
	}

	let textSegmentIndex = 0;
	let newText = '';
	const newFormats = [];
	const newReplacements = [];

	for ( const segment of segments ) {
		if ( segment.type === 'text' ) {
			let updatedText = segment.content;

			if ( textSegmentIndex === 0 ) {
				updatedText = updatedLeadingText;
			} else if ( textSegmentIndex === textSegments.length - 1 ) {
				updatedText = updatedTrailingText;
			}

			for ( let index = 0; index < updatedText.length; index++ ) {
				newText += updatedText[ index ];
				newFormats.push( undefined );
				newReplacements.push( undefined );
			}

			textSegmentIndex++;
			continue;
		}

		newText += segment.character;
		newFormats.push( segment.format );
		newReplacements.push( segment.replacement );
	}

	return {
		text: newText,
		formats: newFormats,
		replacements: newReplacements,
	};
}
