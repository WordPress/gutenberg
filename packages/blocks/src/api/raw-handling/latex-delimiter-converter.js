/**
 * LaTeX delimiter definitions.
 */
const DELIMITERS = {
	display: [
		{ start: '$$', end: '$$' },
		{ start: '\\[', end: '\\]' },
	],
	inline: [
		{ start: '$', end: '$' },
		{ start: '\\(', end: '\\)' },
	],
};

/**
 * Tags whose content should not be processed for LaTeX.
 */
const SKIP_TAGS = [ 'code', 'pre', 'script', 'style', 'textarea' ];

/**
 * Checks if a position in text is escaped (preceded by odd number of backslashes).
 *
 * @param {string} text  The text to check.
 * @param {number} index The position to check.
 * @return {boolean} True if the position is escaped.
 */
function isEscaped( text, index ) {
	let backslashes = 0;
	let i = index - 1;
	while ( i >= 0 && text[ i ] === '\\' ) {
		backslashes++;
		i--;
	}
	return backslashes % 2 === 1;
}

/**
 * Checks if a $ at the given position looks like currency rather than math.
 *
 * @param {string} text  The text to check.
 * @param {number} index The position of the $.
 * @return {boolean} True if it appears to be currency.
 */
function isCurrency( text, index ) {
	const after = text.slice( index + 1, index + 15 );

	// $ followed by digit (with optional space) is likely currency: $100, $ 50
	if ( /^\s?\d/.test( after ) ) {
		// Check if there's a closing $ that would make it math
		const closingIndex = after.indexOf( '$' );
		if ( closingIndex !== -1 ) {
			const content = after.slice( 0, closingIndex );
			// If content between $ signs is purely numeric, it's currency
			if ( /^\s?[\d,]+\.?\d*\s?$/.test( content ) ) {
				return true;
			}
			// Otherwise it might be math like $5 + 3$
			return false;
		}
		// No closing $, starts with digit - likely currency
		return true;
	}

	return false;
}

/**
 * Finds the closing delimiter for a math expression, handling nested braces.
 *
 * @param {string} text         The text to search.
 * @param {number} contentStart The start of the math content (after opening delimiter).
 * @param {string} endDelim     The closing delimiter to find.
 * @param {string} startDelim   The opening delimiter (for $/$$ disambiguation).
 * @return {number} The index of the closing delimiter, or -1 if not found.
 */
function findClosingDelimiter( text, contentStart, endDelim, startDelim ) {
	let braceDepth = 0;

	for ( let i = contentStart; i < text.length; i++ ) {
		const char = text[ i ];

		// Track brace depth for nested LaTeX commands like \frac{1}{2}
		if ( char === '{' && ! isEscaped( text, i ) ) {
			braceDepth++;
		} else if ( char === '}' && ! isEscaped( text, i ) ) {
			braceDepth--;
		}

		// Only look for closing delimiter when braces are balanced
		if ( braceDepth === 0 ) {
			// Check if we're at the closing delimiter
			if ( text.slice( i, i + endDelim.length ) === endDelim ) {
				if ( isEscaped( text, i ) ) {
					continue;
				}

				// For single $, make sure it's not actually $$
				if ( endDelim === '$' && startDelim === '$' ) {
					// If next char is also $, this is part of $$, skip
					if ( text[ i + 1 ] === '$' ) {
						continue;
					}
				}

				return i;
			}
		}
	}

	return -1;
}

/**
 * Parses text for LaTeX delimiters and converts them to math elements.
 *
 * @param {string} text The text to parse.
 * @return {string} Text with LaTeX converted to <math> elements.
 */
function convertLatexInText( text ) {
	let result = '';
	let currentIndex = 0;

	while ( currentIndex < text.length ) {
		let bestMatch = null;

		// Check all delimiter types, prioritizing $$ over $
		const allDelimiters = [
			...DELIMITERS.display.map( ( d ) => ( { ...d, isDisplay: true } ) ),
			...DELIMITERS.inline.map( ( d ) => ( { ...d, isDisplay: false } ) ),
		];

		for ( const delim of allDelimiters ) {
			const index = text.indexOf( delim.start, currentIndex );
			if ( index === -1 ) {
				continue;
			}

			// Skip if escaped
			if ( isEscaped( text, index ) ) {
				continue;
			}

			// For single $, check if it's actually $$ or currency
			if ( delim.start === '$' && ! delim.isDisplay ) {
				// If next char is also $, let $$ handler deal with it
				if ( text[ index + 1 ] === '$' ) {
					continue;
				}
				// Check for currency
				if ( isCurrency( text, index ) ) {
					continue;
				}
			}

			// Find closing delimiter
			const contentStart = index + delim.start.length;
			const closeIndex = findClosingDelimiter(
				text,
				contentStart,
				delim.end,
				delim.start
			);
			if ( closeIndex === -1 ) {
				continue;
			}

			// Check if this is the earliest match
			if ( ! bestMatch || index < bestMatch.index ) {
				bestMatch = {
					index,
					contentStart,
					closeIndex,
					endIndex: closeIndex + delim.end.length,
					isDisplay: delim.isDisplay,
				};
			}
		}

		if ( ! bestMatch ) {
			// No more delimiters, add remaining text
			result += text.slice( currentIndex );
			break;
		}

		// Add text before the match
		result += text.slice( currentIndex, bestMatch.index );

		// Extract and escape LaTeX content
		const latex = text.slice(
			bestMatch.contentStart,
			bestMatch.closeIndex
		);
		const escapedLatex = latex
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );

		// Create math element
		// Display math gets display="block" attribute for conversion to math block
		if ( bestMatch.isDisplay ) {
			result += `<math display="block" data-latex="${ escapedLatex }"></math>`;
		} else {
			result += `<math data-latex="${ escapedLatex }"></math>`;
		}

		currentIndex = bestMatch.endIndex;
	}

	return result;
}

/**
 * Converts LaTeX delimiters in HTML to <math> elements.
 * Skips content inside code, pre, script, style tags.
 *
 * @param {string} HTML The HTML string to process.
 * @return {string} HTML with LaTeX converted to <math> elements.
 */
export default function latexDelimiterConverter( HTML ) {
	// Simple approach: split by tags, process text parts only
	// This regex matches HTML tags
	const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;

	let result = '';
	let lastIndex = 0;
	let skipDepth = 0;
	let currentSkipTag = null;

	let match;
	while ( ( match = tagRegex.exec( HTML ) ) !== null ) {
		const [ fullTag, tagName ] = match;
		const tagLower = tagName.toLowerCase();
		const isClosing = fullTag.startsWith( '</' );

		// Process text before this tag
		const textBefore = HTML.slice( lastIndex, match.index );
		if ( textBefore ) {
			if ( skipDepth === 0 ) {
				result += convertLatexInText( textBefore );
			} else {
				result += textBefore;
			}
		}

		// Add the tag itself
		result += fullTag;

		// Track skip tags
		if ( SKIP_TAGS.includes( tagLower ) ) {
			if ( isClosing ) {
				if ( currentSkipTag === tagLower ) {
					skipDepth--;
					if ( skipDepth === 0 ) {
						currentSkipTag = null;
					}
				}
			} else if ( ! fullTag.endsWith( '/>' ) ) {
				// Opening tag (not self-closing)
				if ( skipDepth === 0 ) {
					currentSkipTag = tagLower;
				}
				skipDepth++;
			}
		}

		lastIndex = match.index + fullTag.length;
	}

	// Process remaining text after last tag
	const remainingText = HTML.slice( lastIndex );
	if ( remainingText ) {
		if ( skipDepth === 0 ) {
			result += convertLatexInText( remainingText );
		} else {
			result += remainingText;
		}
	}

	return result;
}

/**
 * Checks if text contains LaTeX delimiters that should be processed.
 *
 * @param {string} text The text to check.
 * @return {boolean} True if LaTeX delimiters are present.
 */
export function hasLatexDelimiters( text ) {
	if ( ! text ) {
		return false;
	}

	// Check for display math delimiters
	if ( text.includes( '$$' ) || text.includes( '\\[' ) ) {
		return true;
	}

	// Check for \( \) inline math
	if ( text.includes( '\\(' ) && text.includes( '\\)' ) ) {
		return true;
	}

	// Check for $ inline math (but not just currency)
	const dollarMatches = text.match( /\$[^$]+\$/g );
	if ( dollarMatches ) {
		// Check if any of them look like math (not currency)
		for ( const match of dollarMatches ) {
			const content = match.slice( 1, -1 );
			// If content is not purely numeric, it's likely math
			if ( ! /^\s?[\d,]+\.?\d*\s?$/.test( content ) ) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Checks if the text is purely display math (for creating a math block).
 *
 * @param {string} text The text to check.
 * @return {boolean} True if the text is purely display math.
 */
export function isPureDisplayMath( text ) {
	if ( ! text ) {
		return false;
	}

	const trimmed = text.trim();

	// Check for $$ ... $$
	if ( trimmed.startsWith( '$$' ) && trimmed.endsWith( '$$' ) ) {
		// Make sure there's content and no other $$ in between
		const inner = trimmed.slice( 2, -2 );
		if ( inner.length > 0 && ! inner.includes( '$$' ) ) {
			return true;
		}
	}

	// Check for \[ ... \]
	if ( trimmed.startsWith( '\\[' ) && trimmed.endsWith( '\\]' ) ) {
		const inner = trimmed.slice( 2, -2 );
		if ( inner.length > 0 ) {
			return true;
		}
	}

	return false;
}

/**
 * Extracts the LaTeX content from display math delimiters.
 *
 * @param {string} text The text containing display math.
 * @return {string} The LaTeX content without delimiters.
 */
export function extractDisplayMathContent( text ) {
	const trimmed = text.trim();

	if ( trimmed.startsWith( '$$' ) && trimmed.endsWith( '$$' ) ) {
		return trimmed.slice( 2, -2 ).trim();
	}

	if ( trimmed.startsWith( '\\[' ) && trimmed.endsWith( '\\]' ) ) {
		return trimmed.slice( 2, -2 ).trim();
	}

	return text;
}
