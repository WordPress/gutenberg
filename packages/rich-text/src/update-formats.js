/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';
import {
	defineFormatsAccessor,
	mapFromFormats,
	materializeFormats,
} from './format-ranges';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Efficiently updates all the formats from `start` (including) until `end`
 * (excluding) with the active formats. Mutates `value`.
 *
 * Materialises a sparse view of `_formats`, applies the same per-position
 * update the legacy algorithm did, then rebuilds `_formats` so it stays in
 * sync. `value._formats` is replaced with a fresh Map; in-place mutation of
 * the previous Map's entries is not propagated.
 *
 * @param {Object}        $1         Named parameters.
 * @param {RichTextValue} $1.value   Value to update.
 * @param {number}        $1.start   Index to update from.
 * @param {number}        $1.end     Index to update until.
 * @param {Array}         $1.formats Replacement formats.
 *
 * @return {RichTextValue} Mutated value.
 */
export function updateFormats( { value, start, end, formats } ) {
	const min = Math.min( start, end );
	const max = Math.max( start, end );

	const sourceFormats = value._formats || mapFromFormats( value.formats );
	const materialised = materializeFormats( sourceFormats, value.text.length );
	const working = materialised.slice();

	const formatsBefore = working[ min - 1 ] || [];
	const formatsAfter = working[ max ] || [];

	// First, fix the references. If any format right before or after are
	// equal, the replacement format should use the same reference.
	value.activeFormats = formats.map( ( format, index ) => {
		if ( formatsBefore[ index ] ) {
			if ( isFormatEqual( format, formatsBefore[ index ] ) ) {
				return formatsBefore[ index ];
			}
		} else if ( formatsAfter[ index ] ) {
			if ( isFormatEqual( format, formatsAfter[ index ] ) ) {
				return formatsAfter[ index ];
			}
		}

		return format;
	} );

	let cursor = max;
	while ( --cursor >= min ) {
		if ( value.activeFormats.length > 0 ) {
			working[ cursor ] = value.activeFormats;
		} else {
			delete working[ cursor ];
		}
	}

	// Replace whatever `formats`/`_formats` shape was on `value` (test
	// fixtures often pass a plain object with just `formats`) with the
	// canonical shape: a non-enumerable `_formats` Map and a deprecated
	// `formats` getter that materialises from it. Same reference returned,
	// so callers that hold `value` still see the update.
	if ( 'formats' in value ) {
		delete value.formats;
	}
	if ( '_formats' in value ) {
		delete value._formats;
	}
	value._formats = mapFromFormats( working );
	defineFormatsAccessor( value );

	return value;
}
