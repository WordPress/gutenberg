import { expect, it } from 'vitest';

it( 'recognizes positioned popovers', () => {
	const popover = document.createElement( 'div' );
	const child = document.createElement( 'span' );
	popover.className = 'components-popover is-positioned';
	popover.append( child );

	expect( child ).toBePositionedPopover();
} );
