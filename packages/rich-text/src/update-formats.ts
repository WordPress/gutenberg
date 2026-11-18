import { isFormatEqual } from './is-format-equal';
import type { RichTextFormatList, RichTextValue } from './types';

/**
 * Efficiently updates all the formats from `start` (including) until `end`
 * (excluding) with the active formats. Mutates `value`.
 *
 * @param options         Named paramentes.
 * @param options.value   Value te update.
 * @param options.start   Index to update from.
 * @param options.end     Index to update until.
 * @param options.formats Replacement formats.
 *
 * @return Mutated value.
 */
export function updateFormats( {
	value,
	start,
	end,
	formats,
}: {
	value: RichTextValue;
	start: number;
	end: number;
	formats: RichTextFormatList;
} ) {
	// Start and end may be switched in case of delete.
	const min = Math.min( start, end );
	const max = Math.max( start, end );
	const formatsBefore = value.formats[ min - 1 ] || [];
	const formatsAfter = value.formats[ max ] || [];

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

	while ( --end >= start ) {
		if ( value.activeFormats.length > 0 ) {
			value.formats[ end ] = value.activeFormats;
		} else {
			delete value.formats[ end ];
		}
	}

	return value;
}
