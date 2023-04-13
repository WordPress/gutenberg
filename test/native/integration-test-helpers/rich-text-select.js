/**
 * Internal dependencies
 */
import { typeInRichText } from './rich-text-type';

/**
 * Select text of a RichText component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} richText       RichText test instance.
 * @param {number}                                          selectionStart Selection start position.
 * @param {number}                                          selectionEnd   Selection end position.
 *
 */
export const selectTextInRichText = (
	richText,
	selectionStart = 0,
	selectionEnd = selectionStart
) => {
	typeInRichText( richText, '', { selectionStart, selectionEnd } );
};
