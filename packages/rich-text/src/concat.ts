import { normaliseFormats } from './normalise-formats';
import { create } from './create';
import type { RichTextContent, RichTextValue } from './types';

/**
 * Concats a pair of rich text values. Not that this mutates `a` and does NOT
 * normalise formats!
 *
 * @param a Value to mutate.
 * @param b Value to add read from.
 *
 * @return `a`, mutated.
 */
export function mergePair< T extends RichTextContent >(
	a: T,
	b: RichTextContent
) {
	a.formats = a.formats.concat( b.formats );
	a.replacements = a.replacements.concat( b.replacements );
	a.text += b.text;

	return a;
}

/**
 * Combine all Rich Text values into one. This is similar to
 * `String.prototype.concat`.
 *
 * @param values Objects to combine.
 *
 * @return A new value combining all given records.
 */
export function concat( ...values: RichTextValue[] ) {
	return normaliseFormats( values.reduce( mergePair, create() ) );
}
