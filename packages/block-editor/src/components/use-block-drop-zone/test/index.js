/**
 * Internal dependencies
 */
import { getDropTargetPosition } from '..';

const elementData = [
	{
		top: 0,
		left: 0,
		bottom: 200,
		right: 400,
	},
	{
		top: 200,
		left: 0,
		bottom: 500,
		right: 400,
	},
	{
		top: 500,
		left: 0,
		bottom: 900,
		right: 400,
	},
];

const mapElements =
	( orientation ) =>
	( { top, right, bottom, left, isUnmodifiedDefaultBlock }, index ) => {
		return {
			isUnmodifiedDefaultBlock: !! isUnmodifiedDefaultBlock,
			blockIndex: index,
			getBoundingClientRect() {
				return orientation === 'vertical'
					? {
							top,
							right,
							bottom,
							left,
					  }
					: {
							top: left,
							bottom: right,
							left: top,
							right: bottom,
					  };
			},
		};
	};

const verticalBlocksData = elementData.map( mapElements( 'vertical' ) );
// Flip the elementData to make a horizontal block list.
const horizontalBlocksData = elementData.map( mapElements( 'horizontal' ) );

describe( 'getDropTargetPosition', () => {
	it( 'returns `0` for an empty list of elements', () => {
		const position = { x: 0, y: 0 };
		const orientation = 'horizontal';

		const result = getDropTargetPosition( [], position, orientation );

		expect( result ).toEqual( [ 0, 'insert' ] );
	} );

	describe( 'Vertical block lists', () => {
		const orientation = 'vertical';

		it( 'returns `0` when the position is nearest to the start of the first block', () => {
			const position = { x: 32, y: 0 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 0, 'insert' ] );
		} );

		it( 'returns `1` when the position is nearest to the end of the first block', () => {
			const position = { x: 32, y: 190 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'insert' ] );
		} );

		it( 'returns `1` when the position is nearest to the start of the second block', () => {
			const position = { x: 32, y: 210 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'insert' ] );
		} );

		it( 'returns `2` when the position is nearest to the end of the second block', () => {
			const position = { x: 32, y: 450 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 2, 'insert' ] );
		} );

		it( 'returns `2` when the position is nearest to the start of the third block', () => {
			const position = { x: 32, y: 510 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 2, 'insert' ] );
		} );

		it( 'returns `3` when the position is nearest to the end of the third block', () => {
			const position = { x: 32, y: 880 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'insert' ] );
		} );

		it( 'returns `3` when the position is past the end of the third block', () => {
			const position = { x: 32, y: 920 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'insert' ] );
		} );
		it( 'returns group with index 0 when position is close to the right of the first block', () => {
			const position = { x: 372, y: 0 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 0, 'group', 'right' ] );
		} );
		it( 'returns group with index 1 when position is close to the left of the second block', () => {
			const position = { x: 12, y: 212 };

			const result = getDropTargetPosition(
				verticalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'group', 'left' ] );
		} );
	} );

	describe( 'Horizontal block lists', () => {
		const orientation = 'horizontal';

		it( 'returns `0` when the position is nearest to the start of the first block', () => {
			const position = { x: 0, y: 0 };

			const result = getDropTargetPosition(
				horizontalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 0, 'insert' ] );
		} );

		it( 'returns `1` when the position is nearest to the end of the first block', () => {
			const position = { x: 190, y: 0 };

			const result = getDropTargetPosition(
				horizontalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'insert' ] );
		} );

		it( 'returns `1` when the position is nearest to the start of the second block', () => {
			const position = { x: 210, y: 0 };

			const result = getDropTargetPosition(
				horizontalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'insert' ] );
		} );

		it( 'returns `2` when the position is nearest to the end of the second block', () => {
			const position = { x: 450, y: 0 };

			const result = getDropTargetPosition(
				horizontalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 2, 'insert' ] );
		} );

		it( 'returns `2` when the position is nearest to the start of the third block', () => {
			const position = { x: 510, y: 0 };

			const result = getDropTargetPosition(
				horizontalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 2, 'insert' ] );
		} );

		it( 'returns `3` when the position is nearest to the end of the third block', () => {
			const position = { x: 880, y: 0 };

			const result = getDropTargetPosition(
				horizontalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'insert' ] );
		} );

		it( 'returns `3` when the position is past the end of the third block', () => {
			const position = { x: 920, y: 0 };

			const result = getDropTargetPosition(
				horizontalBlocksData,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'insert' ] );
		} );
	} );

	describe( 'Unmodified default blocks', () => {
		const orientation = 'vertical';

		it( 'handles replacement index when only the first block is an unmodified default block', () => {
			const blocksData = [
				{
					left: 0,
					top: 10,
					right: 400,
					bottom: 210,
					isUnmodifiedDefaultBlock: true,
				},
				{
					left: 0,
					top: 220,
					right: 400,
					bottom: 420,
					isUnmodifiedDefaultBlock: false,
				},
			].map( mapElements( 'vertical' ) );

			// Dropping above the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 0 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping on the top half of the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 20 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping on the bottom half of the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 200 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping slightly after the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 211 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping slightly above the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 219 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping on the top half of the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 230 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping on the bottom half of the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 410 },
					orientation
				)
			).toEqual( [ 2, 'insert' ] );

			// Dropping below the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 421 },
					orientation
				)
			).toEqual( [ 2, 'insert' ] );
		} );

		it( 'handles replacement index when only the second block is an unmodified default block', () => {
			const blocksData = [
				{
					left: 0,
					top: 10,
					right: 400,
					bottom: 210,
					isUnmodifiedDefaultBlock: false,
				},
				{
					left: 0,
					top: 220,
					right: 400,
					bottom: 420,
					isUnmodifiedDefaultBlock: true,
				},
			].map( mapElements( 'vertical' ) );

			// Dropping above the first block.
			expect(
				getDropTargetPosition( blocksData, { x: 0, y: 0 }, orientation )
			).toEqual( [ 0, 'insert' ] );

			// Dropping on the top half of the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 20 },
					orientation
				)
			).toEqual( [ 0, 'insert' ] );

			// Dropping on the bottom half of the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 200 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping slightly after the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 211 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping slightly above the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 219 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping on the top half of the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 230 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping on the bottom half of the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 410 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping below the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 32, y: 421 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );
		} );

		it( 'returns replacement index when both blocks are unmodified default blocks', () => {
			const blocksData = [
				{
					left: 0,
					top: 10,
					right: 400,
					bottom: 210,
					isUnmodifiedDefaultBlock: true,
				},
				{
					left: 0,
					top: 220,
					right: 400,
					bottom: 420,
					isUnmodifiedDefaultBlock: true,
				},
			].map( mapElements( 'vertical' ) );

			// Dropping above the first block.
			expect(
				getDropTargetPosition( blocksData, { x: 0, y: 0 }, orientation )
			).toEqual( [ 0, 'replace' ] );

			// Dropping on the top half of the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 0, y: 20 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping on the bottom half of the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 0, y: 200 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping slightly after the first block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 0, y: 211 },
					orientation
				)
			).toEqual( [ 0, 'replace' ] );

			// Dropping slightly above the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 0, y: 219 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping on the top half of the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 0, y: 230 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping on the bottom half of the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 0, y: 410 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );

			// Dropping below the second block.
			expect(
				getDropTargetPosition(
					blocksData,
					{ x: 0, y: 421 },
					orientation
				)
			).toEqual( [ 1, 'replace' ] );
		} );
	} );
} );
