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
	const trimmedHighlightText = highlight.trim();

	if ( ! trimmedHighlightText ) {
		return <>{ text }</>;
	}

	const regex = new RegExp(
		`(${ escapeRegExp( trimmedHighlightText ) })`,
		'gi'
	);

	return createInterpolateElement( text.replace( regex, '<mark>$&</mark>' ), {
		mark: <mark />,
	} );
};

export default TextHighlight;
