import { describe, expect, it } from 'vitest';
import { isBlockFreeformLocked } from '../private-selectors';

const state = ( { parentLayout, entered = null } ) => ( {
	blocks: {
		parents: new Map( [ [ 'child', 'canvas' ] ] ),
		attributes: new Map( [
			[ 'canvas', { layout: parentLayout } ],
			[ 'child', {} ],
		] ),
	},
	freeformEnteredBlock: entered,
} );

describe( 'isBlockFreeformLocked', () => {
	it( 'locks a block sitting on a canvas', () => {
		expect(
			isBlockFreeformLocked(
				state( { parentLayout: { type: 'freeform' } } ),
				'child'
			)
		).toBe( true );
	} );

	it( 'unlocks the block you have entered', () => {
		expect(
			isBlockFreeformLocked(
				state( {
					parentLayout: { type: 'freeform' },
					entered: 'child',
				} ),
				'child'
			)
		).toBe( false );
	} );

	it( 'still locks its siblings', () => {
		expect(
			isBlockFreeformLocked(
				state( {
					parentLayout: { type: 'freeform' },
					entered: 'somethingElse',
				} ),
				'child'
			)
		).toBe( true );
	} );

	it( 'leaves blocks that are not on a canvas alone', () => {
		expect(
			isBlockFreeformLocked(
				state( { parentLayout: { type: 'constrained' } } ),
				'child'
			)
		).toBe( false );
	} );

	it( 'leaves a top-level block alone', () => {
		expect(
			isBlockFreeformLocked(
				state( { parentLayout: { type: 'freeform' } } ),
				'canvas'
			)
		).toBe( false );
	} );
} );
