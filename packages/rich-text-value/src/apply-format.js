/**
 * Apply a format object to a Rich Text value from the given `startIndex` to the
 * given `endIndex`. Indices are retrieved from the selection if none are
 * provided.
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
