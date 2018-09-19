/**
 * Check if the given `RichText` value is empty on not.
 *
 * @param {Array} value `RichText` value.
 *
 * @return {boolean} True if empty, false if not.
 */
export const isRichTextValueEmpty = ( value ) => {
	return ! value || ! value.length;
};
