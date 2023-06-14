/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';
import { create } from './create';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Concats a pair of rich text values. Not that this mutates `a` and does NOT
 * normalise formats!
 *
 * @param {Object} a Value to mutate.
 * @param {Object} b Value to add read from.
 *
 * @return {Object} `a`, mutated.
 */
export function mergePair( a, b ) {
	const splitPoint = a.text.length;

	a.formats.length += b.text.length;
	for ( const i in b.formats ) {
		// eslint-disable-next-line no-bitwise
		a.formats[ ( i | 0 ) + splitPoint ] = b.formats[ i ];
	}

	a.replacements.length += b.text.length;
	for ( const i in b.replacements ) {
		// eslint-disable-next-line no-bitwise
		a.replacements[ ( i | 0 ) + splitPoint ] = b.replacements[ i ];
	}

	a.text += b.text;

	return a;
}

/**
 * Combine all Rich Text values into one. This is similar to
 * `String.prototype.concat`.
 *
 * @param {...RichTextValue} values Objects to combine.
 *
 * @return {RichTextValue} A new value combining all given records.
 */
export function concat( ...values ) {
	return normaliseFormats( values.reduce( mergePair, create() ) );
}
