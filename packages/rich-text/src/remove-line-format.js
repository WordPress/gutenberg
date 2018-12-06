/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';
import { normaliseFormats } from './normalise-formats';

function getLineIndex( { start, text }, startIndex = start ) {
	let index = startIndex;

	while ( index-- ) {
		if ( text[ index ] === LINE_SEPARATOR ) {
			return index;
		}
	}
}

function getParentFormats( { text, formats }, startIndex, formatCount ) {
	let index = startIndex;

	while ( index-- ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		const currentFormatCount = formats[ index ] ? formats[ index ].length : 0;

		if ( currentFormatCount === formatCount - 1 ) {
			return formats[ index ];
		}
	}
}

export function removeLineFormat( value ) {
	const { text, formats, start, end } = value;
	const lineIndex = getLineIndex( value );
	const lineFormats = formats[ lineIndex ];

	if ( lineFormats === undefined ) {
		return value;
	}

	const newFormats = formats.slice( 0 );

	newFormats[ lineIndex ] = getParentFormats( value, lineIndex, lineFormats.length );

	if ( newFormats[ lineIndex ] === undefined ) {
		delete newFormats[ lineIndex ];
	}

	return normaliseFormats( {
		text,
		formats: newFormats,
		start,
		end,
	} );
}
