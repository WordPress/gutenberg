/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';
import { create } from './create';

/**
 * Concats a pair of rich text values. Not that this mutates `a` and does NOT
 * normalise formats!
 *
 * @param  {Object} a Value to mutate.
 * @param  {Object} b Value to add read from.
 *
 * @return {Object} `a`, mutated.
 */
export function mergePair( a, b ) {
	a.formats = a.formats.concat( b.formats );
	a.replacements = a.replacements.concat( b.replacements );
	a.text += b.text;

	return a;
}

/**
 * Combine all Rich Text values into one. This is similar to
 * `String.prototype.concat`.
 *
 * @param {...Object} values Objects to combine.
 *
 * @return {Object} A new value combining all given records.
 */
export function concat( ...values ) {
	return normaliseFormats( values.reduce( mergePair, create() ) );
}
