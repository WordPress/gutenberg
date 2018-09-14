/**
 * Checks if a record or record value is empty or not.
 *
 * @param {Object} record Record to use.
 *
 * @return {boolean} True if the record is empty, false if not.
 */
export function isEmpty( { text, formats } ) {
	return text.length === 0 && formats.length === 0;
}
