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

describe( 'getCanvasChild, stepping over what the canvas absorbs', () => {
	const canvas = el( 'canvas', null );
	// A Columns in the section, with a bare wrapper Group in one column and a
	// padded card in the other. The canvas absorbs the Columns, the columns
	// and the bare wrapper; the card stays a box.
	const columns = el( 'columns', canvas );
	const columnOne = el( 'column-1', columns );
	const columnTwo = el( 'column-2', columns );
	const ABSORBED = [ 'columns', 'column-1', 'column-2', 'wrapper' ];
	const isAbsorbed = ( clientId ) => ABSORBED.includes( clientId );

	it( 'picks up the item in the column, not the Columns around it', () => {
		// Without this a press inside a column would pick up the whole
		// Columns block — the very block the first drag dissolves.
		expect(
			getCanvasChild( el( 'item', columnTwo ), canvas, isAbsorbed )
		).toBe( 'item' );
	} );

	it( 'reaches through a bare wrapper Group to the item inside it', () => {
		const wrapper = el( 'wrapper', columnOne );
		const word = el( null, el( null, el( 'heading', wrapper ) ) );

		expect( getCanvasChild( word, canvas, isAbsorbed ) ).toBe( 'heading' );
	} );

	it( 'picks up a card whole, from a press on the text inside it', () => {
		// The card has styling of its own, so it is a box on the canvas and
		// what is inside it travels with it.
		const card = el( 'card', columnOne );

		expect(
			getCanvasChild( el( 'paragraph', card ), canvas, isAbsorbed )
		).toBe( 'card' );
	} );

	it( 'still picks up a direct child of the section', () => {
		expect(
			getCanvasChild( el( 'plain', canvas ), canvas, isAbsorbed )
		).toBe( 'plain' );
	} );

	it( 'picks up nothing from the empty part of a column', () => {
		// There is no item there, and naming the column instead would pick up
		// a block the first drag is about to dissolve. So no drag starts.
		expect( getCanvasChild( columnOne, canvas, isAbsorbed ) ).toBeNull();
	} );
} );
