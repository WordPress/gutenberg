/**
 * Internal dependencies
 */
import { typeInRichText } from './rich-text-type';

/**
 * Select a range within a RichText component.
 *
 * @param {HTMLElement} richText RichText test instance.
 * @param {number}      start    Selection start position.
 * @param {number}      end      Selection end position.
 */
export const selectRangeInRichText = ( richText, start, end = start ) => {
	if ( typeof start !== 'number' ) {
		throw new Error( 'A numerical range start value must be provided.' );
	}

	typeInRichText( richText, '', {
		finalSelectionStart: start,
		finalSelectionEnd: end,
	} );
};
