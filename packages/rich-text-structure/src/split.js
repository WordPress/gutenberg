/**
 * Splits a record into an array of records using a specified separator string
 * or start and end indices to determine where to make each split. If indices
 * are provided, the array will always consist of two records and the content in
 * between will not be returned.
 *
 * @param {Object}        record  Record to modify.
 * @param {number|string} string  Start index, or string at which to split.
 * @param {number}        end     End index.
 *
 * @return {Array} An array of new records.
 */
export function split( { formats, text, start, end }, string ) {
	if ( typeof string !== 'string' ) {
		return splitAtSelection( ...arguments );
	}

	let nextStart = 0;

	return text.split( string ).map( ( substring ) => {
		const startIndex = nextStart;
		const record = {
			formats: formats.slice( startIndex, startIndex + substring.length ),
			text: substring,
		};

		nextStart += string.length + substring.length;

		if ( start !== undefined && end !== undefined ) {
			if ( start > startIndex && start < nextStart ) {
				record.start = start - startIndex;
			} else if ( start < startIndex && end > startIndex ) {
				record.start = 0;
			}

			if ( end > startIndex && end < nextStart ) {
				record.end = end - startIndex;
			} else if ( start < nextStart && end > nextStart ) {
				record.end = substring.length;
			}
		}

		return record;
	} );
}

function splitAtSelection(
	{ formats, text, start, end },
	startIndex = start,
	endIndex = end
) {
	return [
		{
			formats: formats.slice( 0, startIndex ),
			text: text.slice( 0, startIndex ),
		},
		{
			formats: formats.slice( endIndex ),
			text: text.slice( endIndex ),
			start: 0,
			end: 0,
		},
	];
}
