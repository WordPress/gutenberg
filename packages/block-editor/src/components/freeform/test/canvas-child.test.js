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

describe( 'getCanvasChild, stepping over a grid of containers', () => {
	const canvas = el( 'canvas', null );
	// A Columns in the section, with two columns in it.
	const columns = el( 'columns', canvas );
	const columnOne = el( 'column-1', columns );
	const columnTwo = el( 'column-2', columns );
	const isCell = ( clientId ) =>
		clientId === 'column-1' || clientId === 'column-2';

	it( 'picks up the item in the column, not the Columns around it', () => {
		// Without this a press inside a column would pick up the whole
		// Columns block — which is the very block the first drag dissolves.
		const item = el( 'item', columnTwo );

		expect( getCanvasChild( item, canvas, isCell ) ).toBe( 'item' );
	} );

	it( 'picks up the item from a press deep inside it', () => {
		const item = el( 'item', columnOne );
		const word = el( null, el( null, item ) );

		expect( getCanvasChild( word, canvas, isCell ) ).toBe( 'item' );
	} );

	it( 'picks up a Group in a column whole', () => {
		const group = el( 'group', columnOne );

		expect(
			getCanvasChild( el( 'paragraph', group ), canvas, isCell )
		).toBe( 'group' );
	} );

	it( 'steps over a Columns nested in a column too', () => {
		const inner = el( 'inner-columns', columnOne );
		const innerColumn = el( 'inner-column', inner );
		const deep = el( 'deep', innerColumn );
		const nestedIsCell = ( clientId ) =>
			isCell( clientId ) || clientId === 'inner-column';

		expect( getCanvasChild( deep, canvas, nestedIsCell ) ).toBe( 'deep' );
	} );

	it( 'still picks up a direct child of the section', () => {
		expect( getCanvasChild( el( 'plain', canvas ), canvas, isCell ) ).toBe(
			'plain'
		);
	} );

	it( 'picks up nothing from the empty part of a column', () => {
		// There is no item there, and naming the column instead would pick up
		// a block that the first drag is about to dissolve. So the press is
		// left alone and no drag starts.
		expect( getCanvasChild( columnOne, canvas, isCell ) ).toBeNull();
	} );
} );
