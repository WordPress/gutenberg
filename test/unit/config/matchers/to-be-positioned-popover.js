/**
 * Asserts that the specified popover has already been positioned.
 * Necessary because it will be positioned a bit later after it's displayed.
 *
 * @param {HTMLElement} element Popover element.
 */
function toBePositionedPopover( element ) {
	const popover = element?.closest( '.components-popover' );
	const isPopoverPositioned = popover?.classList.contains( 'is-positioned' );
	const pass = !! isPopoverPositioned;

	return {
		pass,
		message: () => {
			const is = pass ? 'is' : 'is not';
			return ! popover
				? `Received element ${ is } a popover element or its descendant.`
				: `Received element ${ is } positioned`;
		},
	};
}

expect.extend( { toBePositionedPopover } );
