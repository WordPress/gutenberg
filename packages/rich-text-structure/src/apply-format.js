/**
 * Applies a given format to a record from the given start to the given end.
 * If either start or end are omitted, the record's selection will be used.
 * If at any index there is already a format of the same type present, it will
 * be removed.
 *
 * @param {Object} record     Record to modify.
 * @param {Object} format     Format to apply.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new record with the format applied.
 */
export function applyFormat(
	{ formats, text, start, end },
	format,
	startIndex = start,
	endIndex = end
) {
	const newFormats = formats.slice( 0 );

	for ( let index = startIndex; index < endIndex; index++ ) {
		if ( formats[ index ] ) {
			const newFormatsAtIndex = formats[ index ].filter( ( { type } ) => type !== format.type );
			newFormatsAtIndex.push( format );
			newFormats[ index ] = newFormatsAtIndex;
		} else {
			newFormats[ index ] = [ format ];
		}
	}

	return { formats: newFormats, text, start, end };
}
