/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import locks from '../reducer';

const buildNode = ( children = {} ) => ( {
	locks: [],
	children,
} );

describe( 'locks', () => {
	it( 'Enqueues lock requests', () => {
		const request = {};
		const state = deepFreeze( {
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

		const request = { store: 'bird', path: [ 'green' ] };
		const state = deepFreeze( {
			requests: [ request ],
			tree,
		} );

		const lock = {};
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
		const lock = {
			store: 'bird',
			path: [ 'green' ],
		};
		const state = deepFreeze( {
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
