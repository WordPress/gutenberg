/**
 * Gets the all format objects at the start of the selection.
 *
 * @param {Object} value Value to inspect.
 *
 * @return {?Object} Active format objects.
 */
export function getActiveFormats( { formats, start, selectedFormat } ) {
	if ( start === undefined ) {
		return [];
	}

	const formatsBefore = formats[ start - 1 ] || [];
	const formatsAfter = formats[ start ] || [];

	let source = formatsAfter;

	if ( formatsBefore.length > formatsAfter.length ) {
		source = formatsBefore;
	}

	return source.slice( 0, selectedFormat );
}
