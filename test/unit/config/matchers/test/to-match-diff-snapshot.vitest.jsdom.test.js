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

	it( 'recognizes positioned popovers', () => {
		const popover = document.createElement( 'div' );
		const child = document.createElement( 'span' );
		popover.className = 'components-popover is-positioned';
		popover.append( child );

		expect( child ).toBePositionedPopover();
	} );
} );
