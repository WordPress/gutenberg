/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';
import { create } from './create';
import { mapFromFormats, mergeFormatsInto } from './format-ranges';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Concats a pair of rich text values. Note that this mutates `a` and does NOT
 * normalise formats!
 *
 * @param {Object} a Value to mutate.
 * @param {Object} b Value to read from.
 *
 * @return {Object} `a`, mutated.
 */
export function mergePair( a, b ) {
	if ( ! a._formats ) {
		a._formats = mapFromFormats( a.formats );
	}
	mergeFormatsInto( a, b );
	a.replacements = a.replacements.concat( b.replacements );
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
