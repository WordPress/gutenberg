/**
 * Internal dependencies
 */
import { getNearestBlockIndex } from '..';

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
	// Fourth block wraps to the next row/column.
	{
		top: 0,
		left: 400,
		bottom: 300,
		right: 800,
	},
];

const createMockClassList = ( classes ) => {
	return {
		contains( textToMatch ) {
			return classes.includes( textToMatch );
		},
	};
};

const mapElements = ( orientation ) => (
	{ top, right, bottom, left },
	index
) => {
	return {
		dataset: { block: index + 1 },
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
		classList: createMockClassList( 'wp-block' ),
	};
};

const verticalElements = elementData.map( mapElements( 'vertical' ) );
// Flip the elementData to make a horizontal block list.
const horizontalElements = elementData.map( mapElements( 'horizontal' ) );

describe( 'getNearestBlockIndex', () => {
	it( 'returns `undefined` for an empty list of elements', () => {
		const emptyElementList = [];
		const position = { x: 0, y: 0 };
		const orientation = 'horizontal';

		const result = getNearestBlockIndex(
			emptyElementList,
			position,
			orientation
		);

		expect( result ).toBeUndefined();
	} );

	describe( 'Vertical block lists', () => {
		const orientation = 'vertical';

		it( 'returns `0` when the position is nearest to the start of the first block', () => {
			const position = { x: 0, y: 0 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 0 );
		} );

		it( 'returns `1` when the position is nearest to the end of the first block', () => {
			const position = { x: 0, y: 190 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 1 );
		} );

		it( 'returns `1` when the position is nearest to the start of the second block', () => {
			const position = { x: 0, y: 210 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 1 );
		} );

		it( 'returns `2` when the position is nearest to the end of the second block', () => {
			const position = { x: 0, y: 450 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 2 );
		} );

		it( 'returns `2` when the position is nearest to the start of the third block', () => {
			const position = { x: 0, y: 510 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 2 );
		} );

		it( 'returns `3` when the position is nearest to the end of the third block', () => {
			const position = { x: 0, y: 880 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 3 );
		} );

		it( 'returns `3` when the position is past the end of the third block', () => {
			const position = { x: 0, y: 920 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 3 );
		} );

		it( 'returns `3` when the position is nearest to the start of the fourth block', () => {
			const position = { x: 401, y: 0 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 3 );
		} );

		it( 'returns `4` when the position is nearest to the end of the fourth block', () => {
			const position = { x: 401, y: 300 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toBe( 4 );
		} );
	} );

	describe( 'Horizontal block lists', () => {
		const orientation = 'horizontal';

		it( 'returns `0` when the position is nearest to the start of the first block', () => {
			const position = { x: 0, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 0 );
		} );

		it( 'returns `1` when the position is nearest to the end of the first block', () => {
			const position = { x: 190, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 1 );
		} );

		it( 'returns `1` when the position is nearest to the start of the second block', () => {
			const position = { x: 210, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 1 );
		} );

		it( 'returns `2` when the position is nearest to the end of the second block', () => {
			const position = { x: 450, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 2 );
		} );

		it( 'returns `2` when the position is nearest to the start of the third block', () => {
			const position = { x: 510, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 2 );
		} );

		it( 'returns `3` when the position is nearest to the end of the third block', () => {
			const position = { x: 880, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 3 );
		} );

		it( 'returns `3` when the position is past the end of the third block', () => {
			const position = { x: 920, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 3 );
		} );

		it( 'returns `3` when the position is nearest to the start of the fourth block', () => {
			const position = { x: 0, y: 401 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 3 );
		} );

		it( 'returns `4` when the position is nearest to the end of the fourth block', () => {
			const position = { x: 300, y: 401 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toBe( 4 );
		} );
	} );
} );
