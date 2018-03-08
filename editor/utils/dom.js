/**
 * Given a block UID, returns the corresponding DOM node for the block, if
 * exists. As much as possible, this helper should be avoided, and used only
 * in cases where isolated behaviors need remote access to a block node.
 *
 * @param {string} uid Block UID.
 *
 * @return {Element} Block DOM node.
 */
export function getBlockDOMNode( uid ) {
	return document.querySelector( '[data-block="' + uid + '"]' );
}
