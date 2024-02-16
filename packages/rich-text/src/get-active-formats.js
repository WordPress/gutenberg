/** @typedef {import('./types').RichTextValue} RichTextValue */
/** @typedef {import('./types').RichTextFormatList} RichTextFormatList */

export function getFormatsAtSelection( _formats, startIndex, endIndex ) {
	const formatsAtIndex = [];

	if ( endIndex === undefined ) {
		endIndex = startIndex;
	} else {
		endIndex--;
	}

	for ( const [ format, [ start, end ] ] of _formats ) {
		if ( start <= startIndex && end > endIndex ) {
			formatsAtIndex.push( format );
		}
	}

	return formatsAtIndex;
}

/**
 * Gets the all format objects at the start of the selection.
 *
 * @param {RichTextValue} value                Value to inspect.
 * @param {Array}         EMPTY_ACTIVE_FORMATS Array to return if there are no
 *                                             active formats.
 *
 * @return {RichTextFormatList} Active format objects.
 */
export function getActiveFormats( value, EMPTY_ACTIVE_FORMATS = [] ) {
	const { _formats, start, end, activeFormats } = value;
	if ( start === undefined ) {
		return EMPTY_ACTIVE_FORMATS;
	}

	if ( start === end ) {
		// For a collapsed caret, it is possible to override the active formats.
		if ( activeFormats ) {
			return activeFormats;
		}

		const formatsBefore =
			getFormatsAtSelection( _formats, start - 1 ) ||
			EMPTY_ACTIVE_FORMATS;
		const formatsAfter =
			getFormatsAtSelection( _formats, start ) || EMPTY_ACTIVE_FORMATS;

		// By default, select the lowest amount of formats possible (which means
		// the caret is positioned outside the format boundary). The user can
		// then use arrow keys to define `activeFormats`.
		if ( formatsBefore.length < formatsAfter.length ) {
			return formatsBefore;
		}

		return formatsAfter;
	}

	const _activeFormats = getFormatsAtSelection( _formats, start, end );
	return _activeFormats.length ? _activeFormats : EMPTY_ACTIVE_FORMATS;
}
