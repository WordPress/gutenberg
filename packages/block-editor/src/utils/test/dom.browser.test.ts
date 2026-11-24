import { afterEach, describe, expect, it } from 'vitest';
import { getOutermostRotatedAncestorBlock } from '../dom';

function createBlock(
	parent: Element,
	style: Partial< CSSStyleDeclaration > = {}
) {
	const block = document.createElement( 'div' );
	block.className = 'block-editor-block-list__block';
	Object.assign( block.style, style );
	parent.appendChild( block );
	return block;
}

afterEach( () => {
	document.body.replaceChildren();
} );

describe( 'getOutermostRotatedAncestorBlock', () => {
	it( 'returns the outermost rotated block, skipping the element itself', () => {
		const outer = createBlock( document.body, { rotate: '10deg' } );
		const middle = createBlock( outer, { rotate: '5deg' } );
		const inner = createBlock( createBlock( middle ), { rotate: '20deg' } );

		expect( getOutermostRotatedAncestorBlock( inner ) ).toBe( outer );
		expect( getOutermostRotatedAncestorBlock( outer ) ).toBeUndefined();
	} );

	it( 'detects a block rotated with transform', () => {
		const outer = createBlock( document.body, {
			transform: 'rotate(15deg)',
		} );
		const inner = createBlock( outer );

		expect( getOutermostRotatedAncestorBlock( inner ) ).toBe( outer );
	} );

	it( 'returns undefined when no ancestor block is rotated', () => {
		const outer = createBlock( document.body );
		const inner = createBlock( outer );

		expect( getOutermostRotatedAncestorBlock( inner ) ).toBeUndefined();
	} );
} );
