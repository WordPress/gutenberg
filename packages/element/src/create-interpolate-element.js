/**
 * External dependencies
 */
import { createElement, cloneElement, Fragment, isValidElement } from 'react';

let indoc,
	offset,
	output,
	stack;

/**
 * Matches tags in the localized string
 *
 * This is used for extracting the tag pattern groups for parsing the localized
 * string and along with the map converting it to a react element.
 *
 * There are four references extracted using this tokenizer:
 *
 * match: Full match of the tag (i.e. <strong>, </strong>, <br/>)
 * isClosing: The closing slash, it it exists.
 * name: The name portion of the tag (strong, br) (if )
 * isSelfClosed: The slash on a self closing tag, if it exists.
 *
 * @type {RegExp}
 */
const tokenizer = /<(\/)?(\w+)\s*(\/)?>/g;

/**
 * The filament describes and element and its children.
 *
 * This is used by the string iterator to track children attached to an element
 * as the string is parsed. This allows for collecting nested elements in
 * the string before creating the parent.
 *
 * @private
 *
 * @param {WPElement} element The element
 *
 * @return {Filament} A constructor for the Filament.
 */
function Filament( element ) {
	return {
		element,
		children: [],
	};
}

/**
 * Tracks recursive-descent parse state.
 *
 * This is a Stack frame holding parent elements until all children have been
 * parsed.
 *
 * @private
 * @param {Filament}  filament         A parent filament which may still have
 *                                     nested children not yet parsed.
 * @param {number}    tokenStart       Offset at which parent element first
 *                                     appears.
 * @param {number}    tokenLength      Length of string marking start of parent
 *                                     element.
 * @param {number}    prevOffset       Running offset at which parsing should
 *                                     continue.
 * @param {number}    leadingTextStart Offset at which last closing element
 *                                     finished, used for finding text between
 *                                     elements
 *
 * @return {Frame} The stack frame tracking parse progress.
 */
function Frame(
	filament,
	tokenStart,
	tokenLength,
	prevOffset,
	leadingTextStart
) {
	return {
		filament,
		tokenStart,
		tokenLength,
		prevOffset,
		leadingTextStart,
	};
}

/**
 * This function creates an interpolated element from a passed in string with
 * specific tags matching how the string should be converted to an element via
 * the conversion map value.
 *
 * @example
 * For example, for the given string:
 *
 * "This is a <span>string</span> with <a>a link</a> and a self-closing
 * <CustomComponentB/> tag"
 *
 * You would have something like this as the conversionMap value:
 *
 * ```js
 * {
 *     span: <span />,
 *     a: <a href={ 'https://github.com' } />,
 *     CustomComponentB: <CustomComponent />,
 * }
 * ```
 *
 * @param {string}  interpolatedString  The interpolation string to be parsed.
 * @param {Object}  conversionMap       The map used to convert the string to
 *                                      a react element.
 * @throws {TypeError}
 * @return {WPElement}  A wp element.
 */
const createInterpolateElement = ( interpolatedString, conversionMap ) => {
	indoc = interpolatedString;
	offset = 0;
	output = [];
	stack = [];
	tokenizer.lastIndex = 0;

	if ( ! isValidConversionMap( conversionMap ) ) {
		throw new TypeError(
			'The conversionMap provided is not valid. It must be an object with values that are WPElements'
		);
	}

	do {
		// twiddle our thumbs
	} while ( proceed( conversionMap ) );
	return createElement( Fragment, null, ...output );
};

/**
 * Validate conversion map.
 *
 * A map is considered valid if it's an object and every value in the object
 * is a WPElement
 *
 * @private
 *
 * @param {Object} conversionMap  The map being validated.
 *
 * @return {boolean}  True means the map is valid.
 */
const isValidConversionMap = ( conversionMap ) => {
	const isObject = typeof conversionMap === 'object';
	const values = isObject && Object.values( conversionMap );
	return isObject &&
		values.length &&
		values.every( ( element ) => isValidElement( element ) );
};

/**
 * This is the iterator over the matches in the string.
 *
 * @private
 *
 * @param {Object} conversionMap The conversion map for the string.
 *
 * @return {boolean} true for continuing to iterate, false for finished.
 */
function proceed( conversionMap ) {
	const next = nextToken();
	const [ tokenType, name, startOffset, tokenLength ] = next;
	const stackDepth = stack.length;
	const leadingTextStart = startOffset > offset ? offset : null;
	if ( ! conversionMap[ name ] ) {
		if ( stackDepth !== 0 ) {
			const { stackLeadingText, tokenStart } = stack.pop();
			output.push( indoc.substr( stackLeadingText, tokenStart ) );
		}
		addText();
		return false;
	}
	switch ( tokenType ) {
		case 'no-more-tokens':
			if ( stackDepth !== 0 ) {
				const { stackLeadingText, tokenStart } = stack.pop();
				output.push( indoc.substr( stackLeadingText, tokenStart ) );
			}
			addText();
			return false;

		case 'self-closed':
			if ( 0 === stackDepth ) {
				if ( null !== leadingTextStart ) {
					output.push(
						indoc.substr( leadingTextStart, startOffset - leadingTextStart )
					);
				}
				output.push( conversionMap[ name ] );
				offset = startOffset + tokenLength;
				return true;
			}

			// otherwise we found an inner element
			addChild(
				new Filament( conversionMap[ name ] ),
				startOffset,
				tokenLength
			);
			offset = startOffset + tokenLength;
			return true;

		case 'opener':
			stack.push(
				new Frame(
					new Filament( conversionMap[ name ] ),
					startOffset,
					tokenLength,
					startOffset + tokenLength,
					leadingTextStart
				)
			);
			offset = startOffset + tokenLength;
			return true;

		case 'closer':
			// if we're not nesting then this is easy - close the block
			if ( 1 === stackDepth ) {
				addFilamentFromStack( startOffset );
				offset = startOffset + tokenLength;
				return true;
			}

			// otherwise we're nested and we have to close out the current
			// block and add it as a innerBlock to the parent
			const stackTop = stack.pop();
			const text = indoc.substr(
				stackTop.prevOffset,
				startOffset - stackTop.prevOffset
			);
			stackTop.filament.children.push( text );
			stackTop.prevOffset = startOffset + tokenLength;

			addChild(
				stackTop.filament,
				stackTop.tokenStart,
				stackTop.tokenLength,
				startOffset + tokenLength
			);
			offset = startOffset + tokenLength;
			return true;

		default:
			addText();
			return false;
	}
}

/**
 * Grabs the next token match in the string and returns it's details.
 *
 * @private
 *
 * @return {Array}  An array of details for the token matched.
 */
function nextToken() {
	const matches = tokenizer.exec( indoc );
	// we have no more tokens
	if ( null === matches ) {
		return [ 'no-more-tokens' ];
	}
	const startedAt = matches.index;
	const [ match, isClosing, name, isSelfClosed ] = matches;
	const length = match.length;
	if ( isSelfClosed ) {
		return [ 'self-closed', name, startedAt, length ];
	}
	if ( isClosing ) {
		return [ 'closer', name, startedAt, length ];
	}
	return [ 'opener', name, startedAt, length ];
}

/**
 * Pushes text extracted from the indoc string to the output stack given the
 * current rawLength value and offset (if rawLength is provided ) or the
 * indoc.length and offset.
 *
 * @private
 *
 * @param {number} rawLength If provided will be used as the length of chars
 *                           to extract.
 */
function addText( rawLength ) {
	const length = rawLength ? rawLength : indoc.length - offset;
	if ( 0 === length ) {
		return;
	}
	output.push( indoc.substr( offset, length ) );
}

/**
 * Pushes a child filament to the associated parent filament's children for the
 * parent currently active in the stack.
 *
 * @private
 *
 * @param {Filament} filament    The child filament to be pushed to the parent.
 * @param {number}   tokenStart  Offset at which child filament first appears.
 * @param {number}   tokenLength Length of string marking start of child filament.
 * @param {number}   lastOffset  Running offset at which parsing should continue.
 */
function addChild( filament, tokenStart, tokenLength, lastOffset ) {
	const parent = stack[ stack.length - 1 ];
	const text = indoc.substr( parent.prevOffset, tokenStart - parent.prevOffset );

	if ( text ) {
		parent.filament.children.push( text );
	}

	parent.filament.children.push(
		cloneElement( filament.element, null, ...filament.children )
	);
	parent.prevOffset = lastOffset ? lastOffset : tokenStart + tokenLength;
}

/**
 * This is called for closing tags. It creates the element currently active in
 * the stack.
 *
 * @private
 *
 * @param {number} endOffset Offset at which the closing tag for the element
 *                           begins in the string. If this is greater than the
 *                           prevOffset attached to the element, then this
 *                           helps capture any remaining nested text nodes in
 *                           the element.
 */
function addFilamentFromStack( endOffset ) {
	const { filament, leadingTextStart, prevOffset, tokenStart } = stack.pop();

	const text = endOffset ?
		indoc.substr( prevOffset, endOffset - prevOffset ) :
		indoc.substr( prevOffset );

	if ( text ) {
		filament.children.push( text );
	}

	if ( null !== leadingTextStart ) {
		output.push( indoc.substr( leadingTextStart, tokenStart - leadingTextStart ) );
	}

	output.push(
		cloneElement(
			filament.element,
			null,
			...filament.children
		)
	);
}

export default createInterpolateElement;
