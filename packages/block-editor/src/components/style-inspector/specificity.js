/**
 * Selector specificity, close enough to the browser's for ordering the rules
 * that match one element. Returned as `[ ids, classes, types ]`.
 *
 * Handles the forms block and theme styles use: `:where()` (zero), `:is()`,
 * `:not()` and `:has()` (their most specific argument), `:nth-child( … of S )`,
 * attribute selectors, and pseudo-elements. Anything it cannot parse counts as
 * a type selector, which keeps the result conservative rather than throwing.
 */

const ZERO = [ 0, 0, 0 ];

const PSEUDO_ELEMENTS_WITH_SINGLE_COLON = new Set( [
	'before',
	'after',
	'first-line',
	'first-letter',
] );

const TAKES_MOST_SPECIFIC_ARGUMENT = new Set( [
	'is',
	'not',
	'has',
	'matches',
	'-webkit-any',
	'-moz-any',
] );

function add( a, b ) {
	return [ a[ 0 ] + b[ 0 ], a[ 1 ] + b[ 1 ], a[ 2 ] + b[ 2 ] ];
}

/**
 * Compares two specificities.
 *
 * @param {number[]} a Specificity.
 * @param {number[]} b Specificity.
 * @return {number} Negative when `a` is less specific, positive when more.
 */
export function compareSpecificity( a, b ) {
	for ( let i = 0; i < 3; i++ ) {
		if ( a[ i ] !== b[ i ] ) {
			return a[ i ] - b[ i ];
		}
	}
	return 0;
}

function maxSpecificity( list ) {
	return list.reduce(
		( max, current ) =>
			compareSpecificity( current, max ) > 0 ? current : max,
		ZERO
	);
}

/**
 * Splits a selector list on its top-level commas, leaving commas inside
 * parentheses, brackets and strings alone.
 *
 * @param {string} selectorText Selector list.
 * @return {string[]} Trimmed selectors.
 */
export function splitSelectorList( selectorText ) {
	const parts = [];
	let depth = 0;
	let quote = null;
	let start = 0;
	for ( let i = 0; i < selectorText.length; i++ ) {
		const char = selectorText[ i ];
		if ( char === '\\' ) {
			i++;
			continue;
		}
		if ( quote ) {
			if ( char === quote ) {
				quote = null;
			}
			continue;
		}
		if ( char === '"' || char === "'" ) {
			quote = char;
		} else if ( char === '(' || char === '[' ) {
			depth++;
		} else if ( char === ')' || char === ']' ) {
			depth--;
		} else if ( char === ',' && depth === 0 ) {
			parts.push( selectorText.slice( start, i ).trim() );
			start = i + 1;
		}
	}
	parts.push( selectorText.slice( start ).trim() );
	return parts.filter( Boolean );
}

// Index just past the bracket that closes the one at `openIndex`.
function skipBalanced( text, openIndex, open, close ) {
	let depth = 0;
	let quote = null;
	for ( let i = openIndex; i < text.length; i++ ) {
		const char = text[ i ];
		if ( char === '\\' ) {
			i++;
			continue;
		}
		if ( quote ) {
			if ( char === quote ) {
				quote = null;
			}
			continue;
		}
		if ( char === '"' || char === "'" ) {
			quote = char;
		} else if ( char === open ) {
			depth++;
		} else if ( char === close ) {
			depth--;
			if ( depth === 0 ) {
				return i + 1;
			}
		}
	}
	return text.length;
}

// Index just past the identifier that starts at `index`.
function skipIdent( text, index ) {
	let i = index;
	while ( i < text.length ) {
		const char = text[ i ];
		if ( char === '\\' ) {
			i += 2;
		} else if ( /[\w-]/.test( char ) || char.charCodeAt( 0 ) > 127 ) {
			i++;
		} else {
			break;
		}
	}
	return i;
}

/**
 * Specificity of one complex selector (no top-level commas).
 *
 * @param {string} selector Selector.
 * @return {number[]} `[ ids, classes, types ]`.
 */
export function getSelectorSpecificity( selector ) {
	let result = ZERO;
	let i = 0;
	while ( i < selector.length ) {
		const char = selector[ i ];
		if ( char === '#' ) {
			result = add( result, [ 1, 0, 0 ] );
			i = skipIdent( selector, i + 1 );
		} else if ( char === '.' ) {
			result = add( result, [ 0, 1, 0 ] );
			i = skipIdent( selector, i + 1 );
		} else if ( char === '[' ) {
			result = add( result, [ 0, 1, 0 ] );
			i = skipBalanced( selector, i, '[', ']' );
		} else if ( char === ':' ) {
			const isPseudoElement = selector[ i + 1 ] === ':';
			const nameStart = i + ( isPseudoElement ? 2 : 1 );
			const nameEnd = skipIdent( selector, nameStart );
			const name = selector.slice( nameStart, nameEnd ).toLowerCase();
			const hasArguments = selector[ nameEnd ] === '(';
			const argumentsEnd = hasArguments
				? skipBalanced( selector, nameEnd, '(', ')' )
				: nameEnd;
			const args = hasArguments
				? selector.slice( nameEnd + 1, argumentsEnd - 1 )
				: '';
			if (
				isPseudoElement ||
				PSEUDO_ELEMENTS_WITH_SINGLE_COLON.has( name )
			) {
				result = add( result, [ 0, 0, 1 ] );
			} else if ( name === 'where' ) {
				// Contributes nothing.
			} else if ( TAKES_MOST_SPECIFIC_ARGUMENT.has( name ) ) {
				result = add(
					result,
					maxSpecificity(
						splitSelectorList( args ).map( getSelectorSpecificity )
					)
				);
			} else if (
				( name === 'nth-child' || name === 'nth-last-child' ) &&
				/\sof\s/i.test( args )
			) {
				const ofSelector = args.split( /\sof\s/i )[ 1 ];
				result = add(
					add( result, [ 0, 1, 0 ] ),
					maxSpecificity(
						splitSelectorList( ofSelector ).map(
							getSelectorSpecificity
						)
					)
				);
			} else {
				result = add( result, [ 0, 1, 0 ] );
			}
			i = argumentsEnd;
		} else if ( /[a-zA-Z\\]/.test( char ) || char.charCodeAt( 0 ) > 127 ) {
			result = add( result, [ 0, 0, 1 ] );
			i = skipIdent( selector, i );
		} else {
			// Whitespace, combinators, `*`, `&` and the nesting selector.
			i++;
		}
	}
	return result;
}

/**
 * Specificity a rule applies to an element with: the most specific selector
 * in the rule's list that the element matches, or `null` when none does.
 *
 * @param {Element} element      Element.
 * @param {string}  selectorText Rule selector list.
 * @return {?number[]} Specificity, or `null` when the rule does not match.
 */
export function getMatchingSpecificity( element, selectorText ) {
	let best = null;
	for ( const selector of splitSelectorList( selectorText ) ) {
		let matches = false;
		try {
			matches = element.matches( selector );
		} catch {
			// Selectors the engine cannot evaluate, such as pseudo-elements.
		}
		if ( ! matches ) {
			continue;
		}
		const specificity = getSelectorSpecificity( selector );
		if ( ! best || compareSpecificity( specificity, best ) > 0 ) {
			best = specificity;
		}
	}
	return best;
}
