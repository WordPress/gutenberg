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

		const formatsAtIndex = formats[ index ] || [];

		if ( formatsAtIndex.length === formatCount - 1 ) {
			return formatsAtIndex;
		}
	}

	return [];
}

export function removeLineFormat( value ) {
	const { text, formats, start, end } = value;
	const lineIndex = getLineIndex( value );
	const lineFormats = formats[ lineIndex ];

	if ( lineFormats === undefined ) {
		return value;
	}

	const newFormats = formats.slice( 0 );
	const parentFormats = getParentFormats( value, lineIndex, lineFormats.length );

	for ( let index = lineIndex; index < end; index++ ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		const trailingFormats = newFormats[ index ].slice( parentFormats.length + 1 );

		newFormats[ index ] = parentFormats.concat( trailingFormats );

		if ( newFormats[ index ].length === 0 ) {
			delete newFormats[ lineIndex ];
		}
	}

	return normaliseFormats( {
		text,
		formats: newFormats,
		start,
		end,
	} );
}
