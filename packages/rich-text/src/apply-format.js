/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';
import { getFormatsAtSelection } from './get-active-formats';

/** @typedef {import('./types').RichTextValue} RichTextValue */
/** @typedef {import('./types').RichTextFormat} RichTextFormat */

/**
 * Apply a format object to a Rich Text value from the given `startIndex` to the
 * given `endIndex`. Indices are retrieved from the selection if none are
 * provided.
 *
 * @param {RichTextValue}  value        Value to modify.
 * @param {RichTextFormat} format       Format to apply.
 * @param {number}         [startIndex] Start index.
 * @param {number}         [endIndex]   End index.
 *
 * @return {RichTextValue} A new value with the format applied.
 */
export function applyFormat(
	value,
	format,
	startIndex = value.start,
	endIndex = value.end
) {
	const { _formats, activeFormats } = value;
	const _newFormats = new Map( _formats );

	// The selection is collapsed.
	if ( startIndex === endIndex ) {
		const startFormat = getFormatsAtSelection( _formats, startIndex ).find(
			( { type } ) => type === format.type
		);

		if ( startFormat ) {
			const range = _newFormats.get( startFormat );
			_newFormats.delete( startFormat );
			_newFormats.set( format, range );
		}
	} else {
		_newFormats.set( format, [ startIndex, endIndex ] );
	}

	return normaliseFormats( {
		...value,
		_formats: _newFormats,
		// Always revise active formats. This serves as a placeholder for new
		// inputs with the format so new input appears with the format applied,
		// and ensures a format of the same type uses the latest values.
		activeFormats: [
			...( activeFormats?.filter(
				( { type } ) => type !== format.type
			) || [] ),
			format,
		],
	} );
}
