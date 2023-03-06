/** @typedef {import('./create').RichTextValue} RichTextValue */
/** @typedef {import('./create').RichTextFormatList} RichTextFormatList */

/**
 * Internal dependencies
 */
import { slice } from './slice';

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
	const { formats, start, end, activeFormats } = value;
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

	// If there's no formats at the start index, there are not active formats.
	if ( ! formats[ start ] ) {
		return EMPTY_ACTIVE_FORMATS;
	}

	const selectedValue = slice( value );

	let _activeFormats = selectedValue.formats[ 0 ];
	let i = selectedValue.formats.length;

	while ( i-- ) {
		const formatsAtIndex = selectedValue.formats[ i ];

		// If we run into any index without formats, we're sure that there's no
		// active formats.
		if ( ! formatsAtIndex ) {
			return EMPTY_ACTIVE_FORMATS;
		}

		// Only keep an active format if it's active for every single index.
		_activeFormats = _activeFormats.filter(
			( format, index ) => format === formatsAtIndex[ index ]
		);
	}

	return _activeFormats || EMPTY_ACTIVE_FORMATS;
}
