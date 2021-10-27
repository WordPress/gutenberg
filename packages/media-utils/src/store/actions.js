/**
 * Returns an action object used in signalling that an attachment, e.g., an image, is to be removed.
 *
 * @param {string} id                 Attachment unique identifier.
 *
 * @return {Object} Action object.
 */
export function removeAttachment( attachment ) {
	console.log( 'removeAttachment', attachment );
	return {
		type: 'REMOVE_ATTACHMENT',
		attachment,
	};
}
