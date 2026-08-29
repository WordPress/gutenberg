/**
 * Replace bare `var(--wpds-*)` references in a CSS value string with
 * `var(--wpds-*, <fallback>)` using the provided token fallback map.
 *
 * Existing fallbacks (i.e. `var()` calls that already contain a comma)
 * are left untouched, making the function safe to run multiple times
 * (idempotent).
 *
 * This is the generic, reusable implementation that takes the fallback
 * map as an argument. For the variant prebound with the package's
 * generated token fallback map, see `./ds-token-fallbacks.mjs`.
 *
 * @param {string}                 cssValue               A CSS declaration value or JS/TS source.
 * @param {Record<string, string>} tokenFallbacks         Map of CSS variable names to their fallback expressions.
 * @param {Object}                 [options]              Options.
 * @param {boolean}                [options.escapeQuotes] When true, treat the input as JS/TS source so that
 *                                                        only CSS-like `var()` references outside comments
 *                                                        and inside string/template literals are rewritten.
 *                                                        Fallback quotes are escaped for JS string literals.
 * @return {string} The value with fallbacks injected.
 */
export function addFallbackToVar(
	cssValue,
	tokenFallbacks,
	{ escapeQuotes = false } = {}
) {
	if ( escapeQuotes ) {
		return transformJsSource( cssValue, tokenFallbacks, { escapeQuotes } );
	}

	return transformCssValue( cssValue, tokenFallbacks, { escapeQuotes } );
}

const BARE_WPDS_VAR_PATTERN = /^var\(\s*(--wpds-[\w-]+)\s*\)/;

/**
 * @param {string}                 cssValue
 * @param {Record<string, string>} tokenFallbacks
 * @param {Object}                 options
 * @param {boolean}                options.escapeQuotes
 * @return {string} The CSS value with fallbacks injected.
 */
function transformCssValue( cssValue, tokenFallbacks, { escapeQuotes } ) {
	let result = '';
	let index = 0;

	while ( index < cssValue.length ) {
		const char = cssValue[ index ];

		if ( char === '"' || char === "'" ) {
			const end = readQuotedSegment( cssValue, index );
			result += cssValue.slice( index, end );
			index = end;
			continue;
		}

		const match = cssValue.slice( index ).match( BARE_WPDS_VAR_PATTERN );
		if ( match ) {
			result += wrapVarWithFallback(
				match[ 1 ],
				tokenFallbacks,
				escapeQuotes
			);
			index += match[ 0 ].length;
			continue;
		}

		result += char;
		index += 1;
	}

	return result;
}

/**
 * @param {string}                 source
 * @param {Record<string, string>} tokenFallbacks
 * @param {Object}                 options
 * @param {boolean}                options.escapeQuotes
 * @return {string} The JS/TS source with fallbacks injected inside string literals.
 */
function transformJsSource( source, tokenFallbacks, options ) {
	let result = '';
	let index = 0;

	while ( index < source.length ) {
		const char = source[ index ];
		const next = source[ index + 1 ];

		if ( char === '/' && next === '/' ) {
			const end = source.indexOf( '\n', index );
			const sliceEnd = end === -1 ? source.length : end;
			result += source.slice( index, sliceEnd );
			index = sliceEnd;
			continue;
		}

		if ( char === '/' && next === '*' ) {
			const end = source.indexOf( '*/', index + 2 );
			const sliceEnd = end === -1 ? source.length : end + 2;
			result += source.slice( index, sliceEnd );
			index = sliceEnd;
			continue;
		}

		if ( char === '"' || char === "'" ) {
			const end = readQuotedSegment( source, index );
			const literal = source.slice( index, end );
			const quote = literal[ 0 ];
			const inner = literal.slice( 1, -1 );
			const transformed = transformCssValue(
				inner,
				tokenFallbacks,
				options
			);
			result += quote + transformed + quote;
			index = end;
			continue;
		}

		if ( char === '`' ) {
			const templateLiteral = transformTemplateLiteral(
				source,
				index,
				tokenFallbacks,
				options
			);
			result += templateLiteral.content;
			index = templateLiteral.end;
			continue;
		}

		result += char;
		index += 1;
	}

	return result;
}

/**
 * @param {string} value
 * @param {number} start
 * @return {number} Index immediately after the closing quote.
 */
function readQuotedSegment( value, start ) {
	const quote = value[ start ];
	let index = start + 1;

	while ( index < value.length ) {
		if ( value[ index ] === '\\' ) {
			index += 2;
			continue;
		}

		if ( value[ index ] === quote ) {
			return index + 1;
		}

		index += 1;
	}

	return value.length;
}

/**
 * @param {string}                 source
 * @param {number}                 start
 * @param {Record<string, string>} tokenFallbacks
 * @param {Object}                 options
 * @param {boolean}                options.escapeQuotes
 * @return {{ content: string, end: number }} Transformed template literal and end index.
 */
function transformTemplateLiteral( source, start, tokenFallbacks, options ) {
	let content = '`';
	let index = start + 1;

	while ( index < source.length ) {
		if ( source[ index ] === '\\' ) {
			content += source.slice( index, index + 2 );
			index += 2;
			continue;
		}

		if ( source[ index ] === '`' ) {
			content += '`';
			return { content, end: index + 1 };
		}

		if ( source[ index ] === '$' && source[ index + 1 ] === '{' ) {
			const expressionEnd = readTemplateExpression( source, index + 2 );
			content += source.slice( index, expressionEnd );
			index = expressionEnd;
			continue;
		}

		const segmentStart = index;
		while ( index < source.length ) {
			if ( source[ index ] === '\\' ) {
				index += 2;
				continue;
			}

			if (
				source[ index ] === '`' ||
				( source[ index ] === '$' && source[ index + 1 ] === '{' )
			) {
				break;
			}

			index += 1;
		}

		content += transformCssValue(
			source.slice( segmentStart, index ),
			tokenFallbacks,
			options
		);
	}

	content += '`';
	return { content, end: source.length };
}

/**
 * @param {string} source
 * @param {number} start
 * @return {number} Index immediately after the closing brace.
 */
function readTemplateExpression( source, start ) {
	let depth = 1;
	let index = start;

	while ( index < source.length && depth > 0 ) {
		const char = source[ index ];
		const next = source[ index + 1 ];

		if ( char === '/' && next === '/' ) {
			const end = source.indexOf( '\n', index );
			index = end === -1 ? source.length : end;
			continue;
		}

		if ( char === '/' && next === '*' ) {
			const end = source.indexOf( '*/', index + 2 );
			index = end === -1 ? source.length : end + 2;
			continue;
		}

		if ( char === '"' || char === "'" || char === '`' ) {
			if ( char === '`' ) {
				index = readTemplateLiteralEnd( source, index );
				continue;
			}

			index = readQuotedSegment( source, index );
			continue;
		}

		if ( char === '{' ) {
			depth += 1;
		} else if ( char === '}' ) {
			depth -= 1;
		}

		index += 1;
	}

	return index;
}

/**
 * @param {string} source
 * @param {number} start
 * @return {number} Index immediately after the closing backtick.
 */
function readTemplateLiteralEnd( source, start ) {
	let index = start + 1;

	while ( index < source.length ) {
		if ( source[ index ] === '\\' ) {
			index += 2;
			continue;
		}

		if ( source[ index ] === '`' ) {
			return index + 1;
		}

		if ( source[ index ] === '$' && source[ index + 1 ] === '{' ) {
			index = readTemplateExpression( source, index + 2 );
			continue;
		}

		index += 1;
	}

	return source.length;
}

/**
 * @param {string}                 tokenName
 * @param {Record<string, string>} tokenFallbacks
 * @param {boolean}                escapeQuotes
 * @return {string} A var() call with the token fallback injected.
 */
function wrapVarWithFallback( tokenName, tokenFallbacks, escapeQuotes ) {
	let fallback = tokenFallbacks[ tokenName ];
	if ( fallback === undefined ) {
		throw new Error(
			`Unknown design token: ${ tokenName }. ` +
				'This token is not in the design system. ' +
				'If this token was recently renamed, update all references to use the new name.'
		);
	}

	if ( escapeQuotes ) {
		fallback = fallback.replaceAll( '"', '\\"' ).replaceAll( "'", "\\'" );
	}

	return `var(${ tokenName }, ${ fallback })`;
}
