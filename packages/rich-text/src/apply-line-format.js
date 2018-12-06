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

function getTargetFormats(
	{ text, formats },
	startIndex,
	formatCount,
) {
	let index = startIndex;

	while ( index-- ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		if ( ! formats[ index ] ) {
			return [];
		}

		if ( formats[ index ].length === formatCount + 1 ) {
			return formats[ index ];
		} else if ( formats[ index ].length === formatCount ) {
			return formats[ index ];
		}
	}

	return [];
}

export function applyLineFormat( value, format, rootFormat ) {
	const lineIndex = getLineIndex( value );

	if ( lineIndex === undefined ) {
		return value;
	}

	const { text, formats, start, end } = value;
	const formatsAtLineIndex = formats[ lineIndex ] || [];
	const targetFormatCount = formatsAtLineIndex.length;
	const targetFormats = getTargetFormats( value, lineIndex, targetFormatCount );
	const previousLineIndex = getLineIndex( value, lineIndex );
	const formatsAtPreviousLineIndex = formats[ previousLineIndex ] || [];

	if ( formatsAtLineIndex.length > formatsAtPreviousLineIndex.length ) {
		return value;
	}

	const newFormats = formats.slice();

	for ( let index = lineIndex; index < end; index++ ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		if ( targetFormats.length === formatsAtLineIndex.length ) {
			const lastformat = targetFormats[ targetFormats.length - 1 ] || rootFormat;

			newFormats[ index ] = targetFormats.concat(
				[ lastformat ],
				( newFormats[ index ] || [] ).slice( targetFormats.length )
			);
		} else {
			newFormats[ index ] = targetFormats;
		}
	}

	return normaliseFormats( {
		text,
		formats: newFormats,
		start,
		end,
	} );
}
