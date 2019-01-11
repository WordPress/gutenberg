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

function getParentLineIndex( { text, formats }, startIndex, formatCount ) {
	let index = startIndex;

	while ( index-- ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		const formatsAtIndex = formats[ index ] || [];

		if ( formatsAtIndex.length === formatCount - 1 ) {
			return index;
		}
	}
}

export function changeListType( value, newFormat ) {
	const { text, formats, start, end } = value;
	const startLineIndex = getLineIndex( value, start );
	const endLineIndex = getLineIndex( value, end );
	const startLineFormats = formats[ startLineIndex ] || [];
	const endLineFormats = formats[ endLineIndex ] || [];
	const startIndex = getParentLineIndex( value, startLineIndex, startLineFormats.length );
	const length = text.length;
	const newFormats = formats.slice( 0 );
	const startCount = startLineFormats.length - 1;
	const endCount = endLineFormats.length - 1;

	let changed;

	for ( let index = startIndex + 1 || 0; index < length; index++ ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		if ( ( newFormats[ index ] || [] ).length <= startCount ) {
			break;
		}

		if ( ! newFormats[ index ] ) {
			continue;
		}

		changed = true;
		newFormats[ index ] = newFormats[ index ].map( ( format, i ) => {
			return i < startCount || i > endCount ? format : newFormat;
		} );
	}

	if ( ! changed ) {
		return value;
	}

	return normaliseFormats( {
		text,
		formats: newFormats,
		start,
		end,
	} );
}
