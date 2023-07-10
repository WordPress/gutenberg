/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { escapeRegExp } from '../utils/strings';
import type { TextHighlightProps } from './types';

/**
 * Highlights occurrences of a given string within another string of text. Wraps
 * each match with a `<mark>` tag which provides browser default styling.
 *
 * ```jsx
 * import { TextHighlight } from '@wordpress/components';
 *
 * const MyTextHighlight = () => (
 *   <TextHighlight
 *     text="Why do we like Gutenberg? Because Gutenberg is the best!"
 *     highlight="Gutenberg"
 *   />
 * );
 * ```
 */
export const TextHighlight = ( props: TextHighlightProps ) => {
	const { text = '', highlight = '' } = props;
	// Convert single string to array, trim thim & filters empty|null values.
	const trimmedHighlightText = ( ! Array.isArray( highlight )
		? [ highlight ]
		: highlight
	)
		// Trim each highlight.
		.map( ( h ) => h.trim() )
		// Filter out empty | null items.
		.filter( ( h ) => !! h )
		// Escape regex for each string.
		.map( ( h ) => escapeRegExp( h ) );

	if ( ! trimmedHighlightText.length ) {
		return <>{ text }</>;
	}

	const regex = new RegExp( `(${ trimmedHighlightText.join( '|' ) })`, 'gi' );

	return createInterpolateElement( text.replace( regex, '<mark>$&</mark>' ), {
		mark: <mark />,
	} );
};

export default TextHighlight;
