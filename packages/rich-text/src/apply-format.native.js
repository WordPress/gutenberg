/**
 * External dependencies
 */

import { cloneDeep } from 'lodash';

/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';

/**
 * Apply a format object to a Rich Text value from the given `startIndex` to the
 * given `endIndex`. Indices are retrieved from the selection if none are
 * provided.
 *
 * @param {Object} value      Value to modify.
 * @param {Object} formats    Formats to apply.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new value with the format applied.
 */
export function applyFormat(
	value,
	formats,
	startIndex = value.start,
	endIndex = value.end
) {
	const { formats: currentFormats, formatPlaceholder, start } = value;

	if ( ! Array.isArray( formats ) ) {
		formats = [ formats ];
	}

	// The selection is collpased, insert a placeholder with the format so new input appears
	// with the format applied.
	if ( startIndex === endIndex ) {
		const previousFormats = currentFormats[ startIndex - 1 ] || [];
		const placeholderFormats = formatPlaceholder && formatPlaceholder.index === start && formatPlaceholder.formats;
		// Follow the same logic as in getActiveFormat: placeholderFormats has priority over previousFormats
		const activeFormats = ( placeholderFormats ? placeholderFormats : previousFormats ) || [];
		return {
			...value,
			formats: currentFormats,
			formatPlaceholder: {
				index: start,
				formats: mergeFormats( activeFormats, formats ),
			},
		};
	}

	const newFormats = currentFormats.slice( 0 );

	for ( let index = startIndex; index < endIndex; index++ ) {
		applyFormats( newFormats, index, formats );
	}

	return normaliseFormats( { ...value, formats: newFormats } );
}

function mergeFormats( formats1, formats2 ) {
	const formatsOut = cloneDeep( formats1 );
	formats2.forEach( ( format2 ) => {
		const format1In2 = formatsOut.find( ( format1 ) => format1.type === format2.type );
		// update properties while keeping the formats ordered
		if ( format1In2 ) {
			Object.assign( format1In2, format2 );
		} else {
			formatsOut.push( cloneDeep( format2 ) );
		}
	} );
	return formatsOut;
}

function applyFormats( formats, index, newFormats ) {
	if ( formats[ index ] ) {
		formats[ index ] = mergeFormats( formats[ index ], newFormats );
	} else {
		formats[ index ] = cloneDeep( newFormats );
	}
}
