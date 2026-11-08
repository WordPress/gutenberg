import { describe, expect, it } from 'vitest';
import {
	materializeNoteThreads,
	partitionNoteThreadsByStatus,
} from '../utils/threads';

describe( 'materializeNoteThreads', () => {
	const comment = ( id, parent = 0, extra = {} ) => ( {
		id,
		parent,
		status: 'hold',
		...extra,
	} );

	it( 'returns empty results for an empty list', () => {
		const { threadsById, rootThreads } = materializeNoteThreads( [] );

		expect( rootThreads ).toEqual( [] );
		expect( threadsById.size ).toBe( 0 );
	} );

	it( 'collects top-level comments as roots, each with an empty reply list', () => {
		const { rootThreads } = materializeNoteThreads( [
			comment( 1 ),
			comment( 2 ),
		] );

		expect( rootThreads.map( ( thread ) => thread.id ) ).toEqual( [
			1, 2,
		] );
		expect(
			rootThreads.every( ( thread ) => thread.reply.length === 0 )
		).toBe( true );
	} );

	it( 'preserves the source order of roots', () => {
		const { rootThreads } = materializeNoteThreads( [
			comment( 5 ),
			comment( 3 ),
			comment( 9 ),
		] );

		expect( rootThreads.map( ( thread ) => thread.id ) ).toEqual( [
			5, 3, 9,
		] );
	} );

	it( 'links replies to their parent, inverting source order', () => {
		// The comments endpoint returns newest first; threads read oldest
		// first, so replies are unshifted rather than pushed.
		const { rootThreads } = materializeNoteThreads( [
			comment( 1 ),
			comment( 2, 1 ),
			comment( 3, 1 ),
		] );

		expect( rootThreads[ 0 ].reply.map( ( r ) => r.id ) ).toEqual( [
			3, 2,
		] );
	} );

	it( 'does not include replies among the roots', () => {
		const { rootThreads } = materializeNoteThreads( [
			comment( 1 ),
			comment( 2, 1 ),
		] );

		expect( rootThreads ).toHaveLength( 1 );
	} );

	it( 'indexes every comment by id, replies included', () => {
		const { threadsById } = materializeNoteThreads( [
			comment( 1 ),
			comment( 2, 1 ),
		] );

		expect( threadsById.get( 2 ).parent ).toBe( 1 );
	} );

	it( 'drops replies whose parent is missing rather than throwing', () => {
		// A resolved-then-deleted root can leave its replies behind in the
		// response; they must not take the whole sidebar down.
		const { rootThreads, threadsById } = materializeNoteThreads( [
			comment( 2, 99 ),
		] );

		expect( rootThreads ).toEqual( [] );
		expect( threadsById.has( 2 ) ).toBe( true );
	} );

	it( 'carries the rest of the comment payload onto the thread', () => {
		const { rootThreads } = materializeNoteThreads( [
			comment( 1, 0, { meta: { _wp_note_anchor: 'core/button' } } ),
		] );

		expect( rootThreads[ 0 ].meta._wp_note_anchor ).toBe( 'core/button' );
	} );
} );

describe( 'partitionNoteThreadsByStatus', () => {
	it( 'splits held threads from approved ones', () => {
		const threads = [
			{ id: 1, status: 'hold' },
			{ id: 2, status: 'approved' },
			{ id: 3, status: 'hold' },
		];

		expect( partitionNoteThreadsByStatus( threads ) ).toEqual( {
			unresolved: [ threads[ 0 ], threads[ 2 ] ],
			resolved: [ threads[ 1 ] ],
		} );
	} );

	it( 'preserves the incoming order within each bucket', () => {
		const threads = [
			{ id: 9, status: 'hold' },
			{ id: 4, status: 'hold' },
		];

		expect(
			partitionNoteThreadsByStatus( threads ).unresolved.map(
				( t ) => t.id
			)
		).toEqual( [ 9, 4 ] );
	} );

	it( 'ignores threads in any other status', () => {
		// Spam and trashed notes come back under `status=all` but belong in
		// neither bucket.
		const threads = [
			{ id: 1, status: 'spam' },
			{ id: 2, status: 'trash' },
		];

		expect( partitionNoteThreadsByStatus( threads ) ).toEqual( {
			unresolved: [],
			resolved: [],
		} );
	} );
} );
