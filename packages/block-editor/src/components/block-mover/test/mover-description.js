/**
 * Internal dependencies
 */
import {
	getBlockMoverDescription,
	getMultiBlockMoverDescription,
} from '../mover-description';

describe( 'block mover', () => {
	const negativeDirection = -1,
		positiveDirection = 1;

	describe( 'getBlockMoverDescription', () => {
		const label = 'Header: Some Header Text';

		it( 'generates a title for the first item moving up', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					0,
					true,
					false,
					negativeDirection
				)
			).toBe(
				`Block ${ label } is at the beginning of the content and can’t be moved up`
			);
		} );

		it( 'generates a title for the last item moving down', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					3,
					false,
					true,
					positiveDirection
				)
			).toBe(
				`Block ${ label } is at the end of the content and can’t be moved down`
			);
		} );

		it( 'generates a title for the second item moving up', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					1,
					false,
					false,
					negativeDirection
				)
			).toBe( `Move ${ label } block from position 2 up to position 1` );
		} );

		it( 'generates a title for the second item moving down', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					1,
					false,
					false,
					positiveDirection
				)
			).toBe(
				`Move ${ label } block from position 2 down to position 3`
			);
		} );

		it( 'generates a title for the only item in the list', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					0,
					true,
					true,
					positiveDirection
				)
			).toBe( `Block ${ label } is the only block, and cannot be moved` );
		} );

		it( 'indicates that the block can be moved left when the orientation is horizontal and the direction is negative', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					1,
					false,
					false,
					negativeDirection,
					'horizontal'
				)
			).toBe(
				`Move ${ label } block from position 2 left to position 1`
			);
		} );

		it( 'indicates that the block can be moved right when the orientation is horizontal and the direction is positive', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					1,
					false,
					false,
					positiveDirection,
					'horizontal'
				)
			).toBe(
				`Move ${ label } block from position 2 right to position 3`
			);
		} );

		it( 'indicates that the block cannot be moved left when the orientation is horizontal and the block is the first block', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					0,
					true,
					false,
					negativeDirection,
					'horizontal'
				)
			).toBe(
				`Block ${ label } is at the beginning of the content and can’t be moved left`
			);
		} );

		it( 'indicates that the block cannot be moved right when the orientation is horizontal and the block is the last block', () => {
			expect(
				getBlockMoverDescription(
					1,
					label,
					3,
					false,
					true,
					positiveDirection,
					'horizontal'
				)
			).toBe(
				`Block ${ label } is at the end of the content and can’t be moved right`
			);
		} );
	} );

	describe( 'getMultiBlockMoverDescription', () => {
		it( 'generates a title moving multiple blocks up', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					1,
					false,
					true,
					negativeDirection
				)
			).toBe( 'Move 4 blocks from position 2 up by one place' );
		} );

		it( 'generates a title moving multiple blocks down', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					0,
					true,
					false,
					positiveDirection
				)
			).toBe( 'Move 4 blocks from position 1 down by one place' );
		} );

		it( 'generates a title for a selection of blocks at the top', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					1,
					true,
					true,
					negativeDirection
				)
			).toBe( 'All blocks are selected, and cannot be moved' );
		} );

		it( 'generates a title for a selection of blocks at the bottom', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					2,
					false,
					true,
					positiveDirection
				)
			).toBe(
				'Blocks cannot be moved down as they are already at the bottom'
			);
		} );

		it( 'indicates that blocks can be moved left when the orientation is horizontal and the direction is negative', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					1,
					false,
					true,
					negativeDirection,
					'horizontal'
				)
			).toBe( 'Move 4 blocks from position 2 left by one place' );
		} );

		it( 'indicates that blocks can be moved right when the orientation is horizontal and the direction is positive', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					0,
					true,
					false,
					positiveDirection,
					'horizontal'
				)
			).toBe( 'Move 4 blocks from position 1 right by one place' );
		} );

		it( 'indicates that blocks cannot be moved left when the orientation is horizontal and a selection of blocks at the left', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					1,
					true,
					true,
					negativeDirection,
					'horizontal'
				)
			).toBe( 'All blocks are selected, and cannot be moved' );
		} );

		it( 'indicates that blocks cannot be moved right when the orientation is horizontal and the block is the last block', () => {
			expect(
				getMultiBlockMoverDescription(
					4,
					2,
					false,
					true,
					positiveDirection,
					'horizontal'
				)
			).toBe(
				'Blocks cannot be moved right as they are already are at the rightmost position'
			);
		} );
	} );
} );
