/**
 * Asserts that the specified popover has already been positioned.
 * Necessary because it will be positioned a bit later after it's displayed.
 *
 * @param {HTMLElement} element Popover element.
 */
function toBePositionedPopover( element ) {
	const pass = element.style.top !== '' && element.style.left !== '';
	return {
		pass,
		message: () => `Received element is ${ pass ? '' : 'not ' }positioned`,
	};
}

expect.extend( { toBePositionedPopover } );
