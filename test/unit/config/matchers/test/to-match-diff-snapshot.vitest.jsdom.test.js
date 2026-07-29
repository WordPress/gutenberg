import { describe, expect, it } from 'vitest';

describe( 'snapshotDiff', () => {
	it( 'formats the established uncolored object diff', () => {
		expect( { visible: false } ).toMatchDiffSnapshot(
			{ visible: true },
			{},
			'object visibility'
		);
	} );

	it( 'supports custom annotations', () => {
		expect( [ 'old' ] ).toMatchDiffSnapshot(
			[ 'new' ],
			{
				aAnnotation: 'Received styles',
				bAnnotation: 'Base styles',
			},
			'custom annotations'
		);
	} );

	it( 'captures matching stylesheet declarations', () => {
		const style = document.createElement( 'style' );
		style.textContent = '.received { color: red; } .base { color: blue; }';
		const received = document.createElement( 'div' );
		const base = document.createElement( 'div' );
		received.className = 'received';
		base.className = 'base';
		document.head.append( style );
		document.body.append( received, base );

		expect( received ).toMatchStyleDiffSnapshot( base, 'style colors' );

		style.remove();
		received.remove();
		base.remove();
	} );

	it( 'recognizes positioned popovers', () => {
		const popover = document.createElement( 'div' );
		const child = document.createElement( 'span' );
		popover.className = 'components-popover is-positioned';
		popover.append( child );

		expect( child ).toBePositionedPopover();
	} );
} );
