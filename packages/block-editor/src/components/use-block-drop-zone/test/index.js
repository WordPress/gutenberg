/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
	getDefaultBlockName,
	setDefaultBlockName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getNearestBlockIndex, getDropTargetIndexAndOperation } from '..';

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

const mapElements =
	( orientation ) =>
	( { top, right, bottom, left }, index ) => {
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

		expect( result ).toEqual( [ undefined, 'after' ] );
	} );

	describe( 'Vertical block lists', () => {
		const orientation = 'vertical';

		it( "returns [0, 'before'] when the position is nearest to the start of the first block", () => {
			const position = { x: 0, y: 0 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 0, 'before' ] );
		} );

		it( "returns [0, 'after'] when the position is nearest to the end of the first block", () => {
			const position = { x: 0, y: 190 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 0, 'after' ] );
		} );

		it( "returns [1, 'before'] when the position is nearest to the start of the second block", () => {
			const position = { x: 0, y: 210 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'before' ] );
		} );

		it( "returns [1, 'after'] when the position is nearest to the end of the second block", () => {
			const position = { x: 0, y: 450 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'after' ] );
		} );

		it( "returns [3, 'before'] when the position is nearest to the start of the last block", () => {
			const position = { x: 401, y: 0 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'before' ] );
		} );

		it( "returns [3, 'after'] when the position is nearest to the end of the last block", () => {
			const position = { x: 401, y: 300 };

			const result = getNearestBlockIndex(
				verticalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'after' ] );
		} );
	} );

	describe( 'Horizontal block lists', () => {
		const orientation = 'horizontal';

		it( "returns [0, 'before'] when the position is nearest to the start of the first block", () => {
			const position = { x: 0, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 0, 'before' ] );
		} );

		it( "returns [0, 'after'] when the position is nearest to the end of the first block", () => {
			const position = { x: 190, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 0, 'after' ] );
		} );

		it( "returns [1, 'before'] when the position is nearest to the start of the second block", () => {
			const position = { x: 210, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'before' ] );
		} );

		it( "returns [1, 'after'] when the position is nearest to the end of the second block", () => {
			const position = { x: 450, y: 0 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 1, 'after' ] );
		} );

		it( "returns [3, 'before'] when the position is nearest to the start of the last block", () => {
			const position = { x: 0, y: 401 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'before' ] );
		} );

		it( "returns [3, 'after'] when the position is nearest to the end of the fourth block", () => {
			const position = { x: 300, y: 401 };

			const result = getNearestBlockIndex(
				horizontalElements,
				position,
				orientation
			);

			expect( result ).toEqual( [ 3, 'after' ] );
		} );
	} );
} );

describe( 'getDropTargetIndexAndOperation', () => {
	let defaultBlockName;

	beforeAll( () => {
		defaultBlockName = getDefaultBlockName();
		registerBlockType( 'test/default-block', { title: 'default block' } );
		registerBlockType( 'test/not-default-block', {
			title: 'not default block',
		} );
		setDefaultBlockName( 'test/default-block' );
	} );

	afterAll( () => {
		setDefaultBlockName( defaultBlockName );
		unregisterBlockType( 'test/default-block' );
		unregisterBlockType( 'test/not-default-block' );
	} );

	it( 'returns insertion index when there are no unmodified default blocks', () => {
		const blocks = [
			createBlock( 'test/not-default-block' ),
			createBlock( 'test/not-default-block' ),
		];

		expect( getDropTargetIndexAndOperation( 0, 'before', blocks ) ).toEqual(
			[ 0, 'insert' ]
		);

		expect( getDropTargetIndexAndOperation( 0, 'after', blocks ) ).toEqual(
			[ 1, 'insert' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'before', blocks ) ).toEqual(
			[ 1, 'insert' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'after', blocks ) ).toEqual(
			[ 2, 'insert' ]
		);
	} );

	it( 'handles replacement index when only the first block is an unmodified default block', () => {
		const blocks = [
			createBlock( 'test/default-block' ),
			createBlock( 'test/not-default-block' ),
		];

		expect( getDropTargetIndexAndOperation( 0, 'before', blocks ) ).toEqual(
			[ 0, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 0, 'after', blocks ) ).toEqual(
			[ 0, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'before', blocks ) ).toEqual(
			[ 0, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'after', blocks ) ).toEqual(
			[ 2, 'insert' ]
		);
	} );

	it( 'handles replacement index when only the second block is an unmodified default block', () => {
		const blocks = [
			createBlock( 'test/not-default-block' ),
			createBlock( 'test/default-block' ),
		];

		expect( getDropTargetIndexAndOperation( 0, 'before', blocks ) ).toEqual(
			[ 0, 'insert' ]
		);

		expect( getDropTargetIndexAndOperation( 0, 'after', blocks ) ).toEqual(
			[ 1, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'before', blocks ) ).toEqual(
			[ 1, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'after', blocks ) ).toEqual(
			[ 1, 'replace' ]
		);
	} );

	it( 'returns replacement index when both blocks are unmodified default blocks', () => {
		const blocks = [
			createBlock( 'test/default-block' ),
			createBlock( 'test/default-block' ),
		];

		expect( getDropTargetIndexAndOperation( 0, 'before', blocks ) ).toEqual(
			[ 0, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 0, 'after', blocks ) ).toEqual(
			[ 0, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'before', blocks ) ).toEqual(
			[ 1, 'replace' ]
		);

		expect( getDropTargetIndexAndOperation( 1, 'after', blocks ) ).toEqual(
			[ 1, 'replace' ]
		);
	} );
} );
