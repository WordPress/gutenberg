import { describe, expect, it } from 'vitest';
import { getCanvasChild } from '../canvas-child';

// Minimal stand-ins: all the helper needs is parentElement and dataset.
const el = ( clientId, parent ) => ( {
	dataset: clientId ? { block: clientId } : {},
	parentElement: parent,
} );

describe( 'getCanvasChild', () => {
	const canvas = el( 'canvas', null );

	it( 'finds the block a deep target sits in', () => {
		const child = el( 'child', canvas );
		const text = el( null, el( null, child ) );

		expect( getCanvasChild( text, canvas ) ).toBe( 'child' );
	} );

	it( 'returns the canvas’s own child, not the innermost block', () => {
		// A paragraph inside a nested group: the group is what this canvas
		// places, so the group is what a drag should move.
		const group = el( 'group', canvas );
		expect( getCanvasChild( el( 'paragraph', group ), canvas ) ).toBe(
			'group'
		);
	} );

	it( 'returns the block itself when it is already a direct child', () => {
		expect( getCanvasChild( el( 'child', canvas ), canvas ) ).toBe(
			'child'
		);
	} );

	it( 'ignores a target outside the canvas', () => {
		expect(
			getCanvasChild( el( 'other', el( null, null ) ), canvas )
		).toBeNull();
	} );

	it( 'ignores the canvas itself', () => {
		expect( getCanvasChild( canvas, canvas ) ).toBeNull();
	} );

	it( 'copes with nothing', () => {
		expect( getCanvasChild( null, canvas ) ).toBeNull();
		expect( getCanvasChild( el( 'x', null ), null ) ).toBeNull();
	} );
} );
