/**
 * Combines all given records into one record.
 *
 * Works like `String.prototype.concat()`.
 *
 * @param {...[object]} records An array of all records to combine.
 *
 * @return {Object} A new record combining all given records.
 */
export function concat( ...records ) {
	return records.reduce( ( accumlator, { formats, text } ) => ( {
		text: accumlator.text + text,
		formats: accumlator.formats.concat( formats ),
	} ) );
}
