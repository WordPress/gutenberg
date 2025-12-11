/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

// Mock all WordPress dependencies BEFORE imports.
jest.mock( '@wordpress/i18n', () => ( {
	__: jest.fn( ( text ) => text ),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	useEntityRecords: jest.fn(),
	store: {},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	useRegistry: jest.fn(),
	combineReducers: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
	privateApis: {},
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: {},
} ) );

jest.mock( '@wordpress/interface', () => ( {
	store: {},
} ) );

jest.mock( '@wordpress/html-entities', () => ( {
	decodeEntities: jest.fn( ( text ) => text ),
} ) );

jest.mock( '@wordpress/element', () => ( {
	...jest.requireActual( '@wordpress/element' ),
	useEffect: jest.requireActual( 'react' ).useEffect,
	useMemo: jest.requireActual( 'react' ).useMemo,
	useCallback: jest.requireActual( 'react' ).useCallback,
	useReducer: jest.requireActual( 'react' ).useReducer,
} ) );

// Mock the lock-unlock module.
jest.mock( '../../../lock-unlock', () => ( {
	unlock: jest.fn( () => ( {
		useBlockElement: jest.fn(),
		cleanEmptyObject: jest.fn( ( obj ) => obj ),
	} ) ),
} ) );

// Mock the store.
jest.mock( '../../../store', () => ( {
	store: {},
} ) );

/**
 * Internal dependencies
 */
import { useBlockComments } from '../hooks';

const { useEntityRecords } = require( '@wordpress/core-data' );
const { useSelect } = require( '@wordpress/data' );

describe( 'useBlockComments', () => {
	const postId = 123;

	const setupMocks = ( {
		threads = [],
		clientIds = [],
		blockAttributes = {},
	} ) => {
		useEntityRecords.mockReturnValue( {
			records: threads,
		} );

		// useSelect is called twice in the hook:.
		// 1. const { getBlockAttributes } = useSelect( blockEditorStore );.
		// 2. const { clientIds } = useSelect( ( select ) => {...}, [] );.
		useSelect.mockImplementation( ( storeOrMapSelect ) => {
			// First call: useSelect( blockEditorStore ).
			if ( typeof storeOrMapSelect !== 'function' ) {
				return {
					getBlockAttributes: ( clientId ) =>
						blockAttributes[ clientId ] || {},
				};
			}
			// Second call: useSelect( ( select ) => {...} ).
			const select = () => ( {
				getClientIdsWithDescendants: () => clientIds,
			} );
			return storeOrMapSelect( select );
		} );
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return correct structure with empty comments', () => {
		setupMocks( {
			threads: [],
			clientIds: [],
			blockAttributes: {},
		} );

		const { result } = renderHook( () => useBlockComments( postId ) );

		expect( result.current ).toHaveProperty( 'resultComments' );
		expect( result.current ).toHaveProperty( 'unresolvedSortedThreads' );
		expect( result.current ).toHaveProperty( 'reflowComments' );
		expect( result.current ).toHaveProperty( 'commentLastUpdated' );
		expect( result.current.resultComments ).toEqual( [] );
		expect( result.current.unresolvedSortedThreads ).toEqual( [] );
	} );

	it( 'should build comment tree with parent and replies', () => {
		const threads = [
			{
				id: 1,
				parent: 0,
				status: 'hold',
				content: 'Parent comment',
			},
			{
				id: 2,
				parent: 1,
				status: 'hold',
				content: 'Reply to parent',
			},
			{
				id: 3,
				parent: 1,
				status: 'hold',
				content: 'Another reply',
			},
		];

		const clientIds = [ 'block-1' ];
		const blockAttributes = {
			'block-1': { metadata: { noteId: 1 } },
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		expect( result.current.resultComments ).toHaveLength( 1 );
		const parentComment = result.current.resultComments[ 0 ];
		expect( parentComment.id ).toBe( 1 );
		expect( parentComment.blockClientId ).toBe( 'block-1' );
		expect( parentComment.reply ).toHaveLength( 2 );
		// Replies should be reversed.
		expect( parentComment.reply[ 0 ].id ).toBe( 3 );
		expect( parentComment.reply[ 1 ].id ).toBe( 2 );
	} );

	it( 'should correctly map blockClientId using reverse map optimization', () => {
		const threads = [
			{ id: 1, parent: 0, status: 'hold', content: 'Comment 1' },
			{ id: 2, parent: 0, status: 'hold', content: 'Comment 2' },
			{ id: 3, parent: 0, status: 'hold', content: 'Comment 3' },
			{ id: 4, parent: 0, status: 'hold', content: 'Comment 4' },
			{ id: 5, parent: 0, status: 'hold', content: 'Comment 5' },
		];

		const clientIds = [
			'block-1',
			'block-2',
			'block-3',
			'block-4',
			'block-5',
		];

		const blockAttributes = {
			'block-1': { metadata: { noteId: 1 } },
			'block-2': { metadata: { noteId: 2 } },
			'block-3': { metadata: { noteId: 3 } },
			'block-4': { metadata: { noteId: 4 } },
			'block-5': { metadata: { noteId: 5 } },
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		expect( result.current.resultComments ).toHaveLength( 5 );

		// Verify each comment has correct blockClientId.
		result.current.resultComments.forEach( ( comment ) => {
			const expectedBlockId = `block-${ comment.id }`;
			expect( comment.blockClientId ).toBe( expectedBlockId );
		} );
	} );

	it( 'should handle orphaned comments (comments without blocks)', () => {
		const threads = [
			{ id: 1, parent: 0, status: 'hold', content: 'Comment 1' },
			{ id: 2, parent: 0, status: 'hold', content: 'Orphaned comment' },
		];

		const clientIds = [ 'block-1' ];
		const blockAttributes = {
			'block-1': { metadata: { noteId: 1 } },
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		expect( result.current.resultComments ).toHaveLength( 2 );
		// Orphaned comments should appear at the end.
		const orphanedComment = result.current.resultComments.find(
			( c ) => c.id === 2
		);
		expect( orphanedComment ).toBeDefined();
		// Orphaned comments have undefined blockClientId (no mapping exists).
		expect( orphanedComment.blockClientId ).toBeUndefined();
	} );

	it( 'should sort unresolved comments before resolved comments', () => {
		const threads = [
			{
				id: 1,
				parent: 0,
				status: 'approved',
				content: 'Resolved comment',
			},
			{ id: 2, parent: 0, status: 'hold', content: 'Unresolved comment' },
			{
				id: 3,
				parent: 0,
				status: 'approved',
				content: 'Another resolved',
			},
		];

		const clientIds = [ 'block-1', 'block-2', 'block-3' ];
		const blockAttributes = {
			'block-1': { metadata: { noteId: 2 } },
			'block-2': { metadata: { noteId: 1 } },
			'block-3': { metadata: { noteId: 3 } },
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		expect( result.current.resultComments ).toHaveLength( 3 );
		// First comment should be unresolved (id: 2).
		expect( result.current.resultComments[ 0 ].id ).toBe( 2 );
		expect( result.current.resultComments[ 0 ].status ).toBe( 'hold' );

		// Unresolved threads should only contain unresolved comments.
		expect( result.current.unresolvedSortedThreads ).toHaveLength( 1 );
		expect( result.current.unresolvedSortedThreads[ 0 ].id ).toBe( 2 );
	} );

	it( 'should preserve block order for comments', () => {
		const threads = [
			{ id: 10, parent: 0, status: 'hold', content: 'Comment 10' },
			{ id: 20, parent: 0, status: 'hold', content: 'Comment 20' },
			{ id: 30, parent: 0, status: 'hold', content: 'Comment 30' },
		];

		// Block order defines comment order.
		const clientIds = [ 'block-1', 'block-2', 'block-3' ];
		const blockAttributes = {
			'block-1': { metadata: { noteId: 30 } }, // Last comment.
			'block-2': { metadata: { noteId: 10 } }, // First comment.
			'block-3': { metadata: { noteId: 20 } }, // Middle comment.
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		// Comments should be ordered by block order.
		expect( result.current.resultComments[ 0 ].id ).toBe( 30 );
		expect( result.current.resultComments[ 1 ].id ).toBe( 10 );
		expect( result.current.resultComments[ 2 ].id ).toBe( 20 );
	} );

	it( 'should handle blocks without noteId metadata', () => {
		const threads = [
			{ id: 1, parent: 0, status: 'hold', content: 'Comment 1' },
		];

		const clientIds = [ 'block-1', 'block-2', 'block-3' ];
		const blockAttributes = {
			'block-1': { metadata: { noteId: 1 } },
			'block-2': { metadata: {} }, // No noteId.
			'block-3': {}, // No metadata at all.
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		expect( result.current.resultComments ).toHaveLength( 1 );
		expect( result.current.resultComments[ 0 ].blockClientId ).toBe(
			'block-1'
		);
	} );

	it( 'should not assign blockClientId to reply comments', () => {
		const threads = [
			{ id: 1, parent: 0, status: 'hold', content: 'Parent' },
			{ id: 2, parent: 1, status: 'hold', content: 'Reply' },
		];

		const clientIds = [ 'block-1' ];
		const blockAttributes = {
			'block-1': { metadata: { noteId: 1 } },
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		const parentComment = result.current.resultComments[ 0 ];
		expect( parentComment.blockClientId ).toBe( 'block-1' );

		// Reply should not have blockClientId.
		const replyComment = parentComment.reply[ 0 ];
		expect( replyComment.blockClientId ).toBeNull();
	} );

	it( 'should handle complex scenario with mixed resolved, unresolved, and orphaned comments', () => {
		const threads = [
			{
				id: 1,
				parent: 0,
				status: 'approved',
				content: 'Resolved with block',
			},
			{ id: 2, parent: 1, status: 'hold', content: 'Reply to resolved' },
			{
				id: 3,
				parent: 0,
				status: 'hold',
				content: 'Unresolved with block',
			},
			{
				id: 4,
				parent: 0,
				status: 'hold',
				content: 'Orphaned unresolved',
			},
			{
				id: 5,
				parent: 0,
				status: 'approved',
				content: 'Orphaned resolved',
			},
		];

		const clientIds = [ 'block-1', 'block-2' ];
		const blockAttributes = {
			'block-1': { metadata: { noteId: 3 } },
			'block-2': { metadata: { noteId: 1 } },
		};

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		// Should have all 4 parent comments (1, 3, 4, 5).
		expect( result.current.resultComments ).toHaveLength( 4 );

		// First should be unresolved with block (id: 3).
		expect( result.current.resultComments[ 0 ].id ).toBe( 3 );
		expect( result.current.resultComments[ 0 ].status ).toBe( 'hold' );
		expect( result.current.resultComments[ 0 ].blockClientId ).toBe(
			'block-1'
		);

		// Then resolved with block (id: 1).
		expect( result.current.resultComments[ 1 ].id ).toBe( 1 );
		expect( result.current.resultComments[ 1 ].status ).toBe( 'approved' );
		expect( result.current.resultComments[ 1 ].blockClientId ).toBe(
			'block-2'
		);

		// Then orphaned comments (4 and 5).
		const orphanedIds = result.current.resultComments
			.slice( 2 )
			.map( ( c ) => c.id );
		expect( orphanedIds ).toContain( 4 );
		expect( orphanedIds ).toContain( 5 );

		// Verify unresolvedSortedThreads only contains unresolved with blocks.
		expect( result.current.unresolvedSortedThreads ).toHaveLength( 1 );
		expect( result.current.unresolvedSortedThreads[ 0 ].id ).toBe( 3 );
	} );

	it( 'should handle large number of threads efficiently', () => {
		// Create 50 threads to test the optimization.
		const threads = Array.from( { length: 50 }, ( _, i ) => ( {
			id: i + 1,
			parent: 0,
			status: i % 2 === 0 ? 'hold' : 'approved',
			content: `Comment ${ i + 1 }`,
		} ) );

		const clientIds = Array.from(
			{ length: 50 },
			( _, i ) => `block-${ i + 1 }`
		);

		const blockAttributes = Object.fromEntries(
			clientIds.map( ( id, i ) => [
				id,
				{ metadata: { noteId: i + 1 } },
			] )
		);

		setupMocks( { threads, clientIds, blockAttributes } );

		const { result } = renderHook( () => useBlockComments( postId ) );

		expect( result.current.resultComments ).toHaveLength( 50 );

		// Verify all comments have correct blockClientId.
		result.current.resultComments.forEach( ( comment ) => {
			expect( comment.blockClientId ).toBe( `block-${ comment.id }` );
		} );

		// Verify unresolved comments come first.
		const unresolvedCount = threads.filter(
			( t ) => t.status === 'hold'
		).length;
		expect( result.current.unresolvedSortedThreads ).toHaveLength(
			unresolvedCount
		);
	} );
} );
