import type { FindAllArgs } from 'highlight-words-core';
import { findAll } from 'highlight-words-core';
import { createElement } from '@wordpress/element';

/**
 * Source:
 * https://github.com/bvaughn/react-highlight-words/blob/HEAD/src/Highlighter.js
 */

interface Options {
	autoEscape?: boolean;
	caseSensitive?: boolean;
	children: string;
	sanitize?: FindAllArgs[ 'sanitize' ];
	searchWords?: string[];
}

/**
 * Creates the highlighted text rendered by Text.
 *
 * @param options               Highlighter options.
 * @param options.autoEscape    Whether to escape regular-expression characters.
 * @param options.caseSensitive Whether matching is case-sensitive.
 * @param options.children      Text to highlight.
 * @param options.sanitize      Text normalization function used for matching.
 * @param options.searchWords   Search terms to highlight.
 */
export function createHighlighterText( {
	autoEscape,
	caseSensitive = false,
	children,
	sanitize,
	searchWords = [],
}: Options ) {
	if ( ! children ) {
		return null;
	}

	const chunks = findAll( {
		autoEscape,
		caseSensitive,
		sanitize,
		searchWords,
		textToHighlight: children,
	} );

	return chunks.map( ( chunk, index ) =>
		createElement( chunk.highlight ? 'mark' : 'span', {
			children: children.slice( chunk.start, chunk.end ),
			key: index,
		} )
	);
}
