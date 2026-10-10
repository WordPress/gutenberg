import { describe, expect, it } from 'vitest';
import { freeformEnteredBlock } from '../reducer';
import { setFreeformEnteredBlock } from '../private-actions';

describe( 'freeformEnteredBlock', () => {
	it( 'starts with no block entered', () => {
		expect(
			freeformEnteredBlock( undefined, { type: 'INIT' } )
		).toBeNull();
	} );

	it( 'remembers the block you have entered', () => {
		expect(
			freeformEnteredBlock( null, setFreeformEnteredBlock( 'abc' ) )
		).toBe( 'abc' );
	} );

	it( 'lets you leave', () => {
		expect(
			freeformEnteredBlock( 'abc', setFreeformEnteredBlock( null ) )
		).toBeNull();
	} );

	it( 'drops the entered block when the selection moves elsewhere', () => {
		// Clicking another block is the "I have finished with those words"
		// gesture, so the block locks itself again.
		expect(
			freeformEnteredBlock( 'abc', {
				type: 'SELECT_BLOCK',
				clientId: 'def',
			} )
		).toBeNull();
	} );

	it( 'stays put when the same block is reselected', () => {
		expect(
			freeformEnteredBlock( 'abc', {
				type: 'SELECT_BLOCK',
				clientId: 'abc',
			} )
		).toBe( 'abc' );
	} );

	it( 'drops it when everything is deselected', () => {
		expect(
			freeformEnteredBlock( 'abc', { type: 'CLEAR_SELECTED_BLOCK' } )
		).toBeNull();
	} );

	it( 'survives the caret moving inside the block it entered', () => {
		// SELECTION_CHANGE fires as the caret lands, which is the whole point
		// of having entered; resetting on it would lock the block instantly.
		expect(
			freeformEnteredBlock( 'abc', {
				type: 'SELECTION_CHANGE',
				clientId: 'abc',
			} )
		).toBe( 'abc' );
	} );

	it( 'ignores unrelated actions', () => {
		expect(
			freeformEnteredBlock( 'abc', { type: 'UPDATE_BLOCK_ATTRIBUTES' } )
		).toBe( 'abc' );
	} );
} );
