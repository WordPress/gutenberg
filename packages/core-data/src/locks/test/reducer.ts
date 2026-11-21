import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import locks from '../reducer';
import type { Lock, LockNode, LockRequest, LocksState } from '../types';

type DeepPartial< T > = { [ K in keyof T ]?: DeepPartial< T[ K ] > };

/**
 * Types a fixture that holds only the fields the code under test reads.
 *
 * @param value The partial fixture.
 */
function partial< T >( value: DeepPartial< T > ): T {
	return value as T;
}

/**
 * Freezes a partial fixture to catch mutations, keeping it writable to the
 * type checker as the code under test expects.
 *
 * @param value The partial fixture.
 */
function frozen< T >( value: DeepPartial< T > ): T {
	return deepFreeze( value ) as T;
}

const buildNode = ( children: Record< string, LockNode > = {} ): LockNode => ( {
	locks: [],
	children,
} );

describe( 'locks', () => {
	it( 'Enqueues lock requests', () => {
		const request = partial< LockRequest >( {} );
		const state = frozen< LocksState >( {
			requests: [],
		} );

		expect(
			locks( state, {
				type: 'ENQUEUE_LOCK_REQUEST',
				request,
			} )
		).toEqual( {
			requests: [ request ],
		} );
	} );

	it( 'Grants lock requests', () => {
		const red = buildNode();
		const blue = buildNode();
		const green = buildNode();
		const bird = buildNode( { red, blue, green } );
		const tree = buildNode( { bird } );

		const request = partial< LockRequest >( {
			store: 'bird',
			path: [ 'green' ],
		} );
		const state = frozen< LocksState >( {
			requests: [ request ],
			tree,
		} );

		const lock = partial< Lock >( {} );
		expect(
			locks( state, {
				type: 'GRANT_LOCK_REQUEST',
				lock,
				request,
			} )
		).toEqual( {
			// Should remove the request...
			requests: [],
			tree: {
				locks: [],
				children: {
					bird: {
						locks: [],
						children: {
							red,
							blue,
							green: {
								// ...and add the lock.
								locks: [ lock ],
								children: {},
							},
						},
					},
				},
			},
		} );
	} );

	it( 'Releases acquired locks', () => {
		const red = buildNode();
		const blue = buildNode();
		const lock = partial< Lock >( {
			store: 'bird',
			path: [ 'green' ],
		} );
		const state = frozen< LocksState >( {
			// Should remove the request...
			requests: [],
			tree: {
				locks: [],
				children: {
					bird: {
						locks: [],
						children: {
							red,
							blue,
							green: {
								// ...and add the lock.
								locks: [ lock ],
								children: {},
							},
						},
					},
				},
			},
		} );

		expect(
			locks( state, {
				type: 'RELEASE_LOCK',
				lock,
			} )
		).toEqual( {
			requests: [],
			tree: {
				locks: [],
				children: {
					bird: {
						locks: [],
						children: {
							red,
							blue,
							green: {
								// Should remove the lock.
								locks: [],
								children: {},
							},
						},
					},
				},
			},
		} );
	} );
} );
