/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Normalises formats: merge adjacent and overlapping formats.
 *
 * @param {RichTextValue} value Value to normalise formats of.
 *
 * @return {RichTextValue} New value with normalised formats.
 */
export function normaliseFormats( value ) {
	const _newFormats = new Map();

	const existing = Array.from( _newFormats.keys() ).filter( ( _format ) =>
		isFormatEqual( _format, format )
	);

	for ( const [ format, [ start, end ] ] of existing ) {
		
	}

	return {
		...value,
		_formats: _newFormats,
	};
}
