/**
 * Gets the all format objects at the start of the selection.
 *
 * @param {Object} value                Value to inspect.
 * @param {Array}  EMPTY_ACTIVE_FORMATS Array to return if there are no active
 *                                      formats.
 *
 * @return {?Object} Active format objects.
 */
export function getActiveFormats(
	{ formats, start, end, activeFormats },
	EMPTY_ACTIVE_FORMATS = []
) {
	if ( start === undefined ) {
		return EMPTY_ACTIVE_FORMATS;
	}

	if ( start === end ) {
		// For a collapsed caret, it is possible to override the active formats.
		if ( activeFormats ) {
			return activeFormats;
		}

		const formatsBefore = formats[ start - 1 ] || EMPTY_ACTIVE_FORMATS;
		const formatsAfter = formats[ start ] || EMPTY_ACTIVE_FORMATS;

		// By default, select the lowest amount of formats possible (which means
		// the caret is positioned outside the format boundary). The user can
		// then use arrow keys to define `activeFormats`.
		if ( formatsBefore.length < formatsAfter.length ) {
			return formatsBefore;
		}

		return formatsAfter;
	}

	return formats[ start ] || EMPTY_ACTIVE_FORMATS;
}
