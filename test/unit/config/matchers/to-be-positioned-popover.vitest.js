import { expect } from 'vitest';

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
