/**
 * Internal dependencies
 */
import { getCommonDepthClientIds, getDragDisplacementValues } from '../utils';

describe( 'getCommonDepthClientIds', () => {
	it( 'should return start and end when no depth is provided', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[],
			[]
		);

		expect( result ).toEqual( { start: 'start-id', end: 'clicked-id' } );
	} );

	it( 'should return deepest start and end when depths match', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[ 'start-1', 'start-2', 'start-3' ],
			[ 'end-1', 'end-2', 'end-3' ]
		);

		expect( result ).toEqual( { start: 'start-id', end: 'clicked-id' } );
	} );

	it( 'should return shallower ids when start is shallower', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[ 'start-1' ],
			[ 'end-1', 'end-2', 'end-3' ]
		);

		expect( result ).toEqual( { start: 'start-id', end: 'end-2' } );
	} );

	it( 'should return shallower ids when end is shallower', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[ 'start-1', 'start-2', 'start-3' ],
			[ 'end-1', 'end-2' ]
		);

		expect( result ).toEqual( { start: 'start-3', end: 'clicked-id' } );
	} );
} );

describe( 'getDragDisplacementValues', () => {
	const blockIndexes = {
		'block-a': 0,
		'block-b': 1,
		'block-c': 2,
		'block-d': 3,
		'block-e': 4,
		'block-f': 5,
		'block-g': 6,
		'block-h': 7,
	};

	it( 'should return displacement of normal when block is after dragged block and drop target', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 3,
			blockDropPosition: 'bottom',
			clientId: 'block-h',
			firstDraggedBlockIndex: 5,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'normal',
			isAfterDraggedBlocks: true,
			isNesting: false,
		} );
	} );

	it( 'should return displacement of up when block is after dragged block and before the drop target', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 7,
			blockDropPosition: 'bottom',
			clientId: 'block-d',
			firstDraggedBlockIndex: 2,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'up',
			isAfterDraggedBlocks: true,
			isNesting: false,
		} );
	} );

	it( 'should return displacement of down when block is before dragged block and after the drop target', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 1,
			blockDropPosition: 'bottom',
			clientId: 'block-d',
			firstDraggedBlockIndex: 6,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'down',
			isAfterDraggedBlocks: false,
			isNesting: false,
		} );
	} );

	it( 'should return isNesting of true when block is just before the drop target and drop position is inside', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 1,
			blockDropPosition: 'inside',
			clientId: 'block-a',
			firstDraggedBlockIndex: 6,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'normal',
			isAfterDraggedBlocks: false,
			isNesting: true,
		} );
	} );

	it( 'should return isNesting of false when block is not just before the drop target and drop position is inside', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 1,
			blockDropPosition: 'inside',
			clientId: 'block-b',
			firstDraggedBlockIndex: 6,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'down',
			isAfterDraggedBlocks: false,
			isNesting: false,
		} );
	} );

	it( 'should return displacement of up when drop target index is null and block is after dragged block', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: null,
			blockDropPosition: 'bottom',
			clientId: 'block-h',
			firstDraggedBlockIndex: 5,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'up',
			isAfterDraggedBlocks: true,
			isNesting: false,
		} );
	} );

	it( 'should return displacement of normal when drop target index is null and block is before dragged block', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: null,
			blockDropPosition: 'bottom',
			clientId: 'block-c',
			firstDraggedBlockIndex: 5,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'normal',
			isAfterDraggedBlocks: false,
			isNesting: false,
		} );
	} );

	it( 'should return displacement of normal when dragging a file (no dragged block) and the block is before the target index', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 3,
			blockDropPosition: 'bottom',
			clientId: 'block-b',
			firstDraggedBlockIndex: undefined,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'normal',
			isAfterDraggedBlocks: false,
			isNesting: false,
		} );
	} );

	it( 'should return displacement of down when dragging a file (no dragged block) and the block is after the target index', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 3,
			blockDropPosition: 'bottom',
			clientId: 'block-h',
			firstDraggedBlockIndex: undefined,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'down',
			isAfterDraggedBlocks: false,
			isNesting: false,
		} );
	} );

	it( 'should return displacement of normal when dragging a file (no dragged block) and dragging outside the list view (drop target of null)', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: null,
			blockDropPosition: 'bottom',
			clientId: 'block-h',
			firstDraggedBlockIndex: undefined,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: 'normal',
			isAfterDraggedBlocks: false,
			isNesting: false,
		} );
	} );

	it( 'should return undefined displacement if the target index is undefined', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: undefined,
			blockDropPosition: 'bottom',
			clientId: 'block-h',
			firstDraggedBlockIndex: undefined,
			isDragged: false,
		} );

		expect( result ).toEqual( {
			displacement: undefined,
			isAfterDraggedBlocks: false,
			isNesting: false,
		} );
	} );

	it( 'should return all undefined values if the block is dragged', () => {
		const result = getDragDisplacementValues( {
			blockIndexes,
			blockDropTargetIndex: 3,
			blockDropPosition: 'bottom',
			clientId: 'block-h',
			firstDraggedBlockIndex: 7,
			isDragged: true,
		} );

		expect( result ).toEqual( {
			displacement: undefined,
			isAfterDraggedBlocks: undefined,
			isNesting: undefined,
		} );
	} );
} );
