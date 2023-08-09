/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';
import { create } from './create';
import { RichTextState as RTS } from './rich-text-state';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Concats a pair of rich text values. Not that this mutates `a` and does NOT
 * normalise formats!
 *
 * @param {RTS} a Value to mutate.
 * @param {RTS} b Value to add read from.
 *
 * @return {RTS} `a`, mutated.
 */
export function mergePair( a, b ) {
	a.append( b );
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
	return normaliseFormats( values.reduce( mergePair, new RTS() ) );
}
