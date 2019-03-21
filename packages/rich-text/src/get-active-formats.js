/**
 * Gets the all format objects at the start of the selection.
 *
 * @param {Object} value Value to inspect.
 *
 * @return {?Object} Active format objects.
 */
export function getActiveFormats( { formats, start, end, activeFormats } ) {
	if ( start === undefined ) {
		return [];
	}

	if ( start === end ) {
		// For a collapsed caret, it is possible to override the active formats.
		if ( activeFormats ) {
			return activeFormats;
		}

		const formatsBefore = formats[ start - 1 ] || [];
		const formatsAfter = formats[ start ] || [];

		if ( formatsBefore.length < formatsAfter.length ) {
			return formatsBefore;
		}

		return formatsAfter;
	}

	return formats[ start ] || [];
}
