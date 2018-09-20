/**
 * Combine all Rich Text values into one. This is similar to
 * `String.prototype.concat`.
 *
 * @param {...[object]} values An array of all values to combine.
 *
 * @return {Object} A new value combining all given records.
 */
export function concat( ...values ) {
	return values.reduce( ( accumlator, { formats, text } ) => ( {
		text: accumlator.text + text,
		formats: accumlator.formats.concat( formats ),
	} ) );
}
