/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getPendingLockRequests, isLockAvailable } from '../selectors';
import { deepCopyLocksTreePath, getNode } from '../utils';

describe( 'getPendingLockRequests', () => {
	it( 'returns pending lock requests', () => {
		const state = deepFreeze( {
			locks: {
				requests: [ 1, 2, 3 ],
			},
		} );

		expect( getPendingLockRequests( state ) ).toEqual( [ 1, 2, 3 ] );
	} );
} );

describe( 'isLockAvailable', () => {
	describe( 'smoke tests', () => {
		it( 'returns true if lock is available', () => {
			const state = deepFreeze( {
				locks: {
					tree: {
						children: {},
						locks: [],
					},
				},
			} );

			expect(
				isLockAvailable( state, 'core', [], { exclusive: true } )
			).toBe( true );
		} );
		it( 'returns false if lock is not available', () => {
			const state = deepFreeze( {
				locks: {
					tree: {
						children: {},
						locks: [ { exclusive: false } ],
					},
				},
			} );

			expect(
				isLockAvailable( state, 'core', [], { exclusive: true } )
			).toBe( false );
		} );
	} );

	describe( 'Advanced cases - exclusive lock', () => {
		let state;
		beforeEach( () => {
			state = buildState( [
				[ 'core', 'entities', 'root', 'template_part', '3' ],
				[ 'core', 'queries' ],
				[ 'vendor' ],
			] );
		} );
		it( `returns true if no parent or descendant has any locks`, () => {
			expect(
				isLockAvailable(
					deepFreeze( state ),
					'core',
					[ 'entities', 'root' ],
					{ exclusive: true }
				)
			).toBe( true );
		} );

		it( `returns true if another branch holds a locks (1/3)`, () => {
			appendLock( state, [ 'core', 'queries' ], {
				exclusive: true,
			} );
			expect(
				isLockAvailable(
					deepFreeze( state ),
					'core',
					[ 'entities', 'root' ],
					{ exclusive: true }
				)
			).toBe( true );
		} );

		it( `returns true if another branch holds a locks (2/3)`, () => {
			appendLock( state, [ 'vendor' ], {
				exclusive: true,
			} );
			expect(
				isLockAvailable(
					deepFreeze( state ),
					'core',
					[ 'entities', 'root' ],
					{ exclusive: true }
				)
			).toBe( true );
		} );

		it( `returns true if another branch holds a locks (3/3)`, () => {
			const subState = {
				locks: {
					tree: {
						locks: [],
						children: {
							postType: {
								locks: [],
								children: {
									post: {
										locks: [],
										children: {
											'16': {
												locks: [
													{
														path: [
															'core',
															'entities',
															'data',
															'postType',
															'post',
															16,
														],
														exclusive: true,
													},
												],
												children: {},
											},
										},
									},
									wp_template_part: {
										locks: [],
										children: {
											'17': {
												locks: [],
												children: {},
											},
										},
									},
								},
							},
						},
					},
				},
			};
			expect(
				isLockAvailable(
					deepFreeze( subState ),
					'core',
					[ 'postType', 'wp_template_part', 17 ],
					{ exclusive: true }
				)
			).toBe( true );
		} );

		[ true, false ].forEach( ( exclusive ) => {
			it( `returns true if the path is not accessible and no parent holds a lock`, () => {
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'core', 'fake', 'path' ],
						{ exclusive: true }
					)
				).toBe( true );
			} );

			it( `returns false if the path is not accessible and any parent holds a lock`, () => {
				appendLock( state, [ 'core' ], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'core', 'fake', 'path' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if top-level parent already has a lock with exclusive=${ exclusive }`, () => {
				appendLock( state, [], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if a direct parent already has a lock with exclusive=${ exclusive }`, () => {
				appendLock( state, [ 'core', 'entities' ], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if the target node already has a lock with exclusive=${ exclusive }`, () => {
				appendLock( state, [ 'core', 'entities', 'root' ], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if a children node already has a lock with exclusive=${ exclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'entities', 'root', 'template_part' ],
					{
						exclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if a grand-children node already has a lock with exclusive=${ exclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'entities', 'root', 'template_part', '3' ],
					{
						exclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );
		} );
	} );

	describe( 'Advanced cases - shared lock', () => {
		let state;
		beforeEach( () => {
			state = buildState( [
				[ 'core', 'entities', 'root', 'template_part', '3' ],
			] );
		} );
		it( `returns true if no parent or descendant has any locks`, () => {
			expect(
				isLockAvailable(
					deepFreeze( state ),
					'core',
					[ 'entities', 'root' ],
					{ exclusive: true }
				)
			).toBe( true );
		} );

		[ true, false ].forEach( ( isOtherLockExclusive ) => {
			const expectation = ! isOtherLockExclusive;
			it( `returns ${ expectation } if the path is not accessible and any parent holds a lock exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, [ 'core' ], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'core', 'fake', 'path' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if top-level parent already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, [], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if a direct parent already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, [ 'core', 'entities' ], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if the target node already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, [ 'core', 'entities', 'root' ], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if a children node already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'entities', 'root', 'template_part' ],
					{
						exclusive: isOtherLockExclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if a grand-children node already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'entities', 'root', 'template_part', '3' ],
					{
						exclusive: isOtherLockExclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );
		} );
	} );
} );

function appendLock( state, path, lock ) {
	getNode( state.locks.tree, path ).locks.push( lock );
}

function buildState( paths ) {
	return {
		locks: {
			requests: [],
			tree: paths.reduce(
				( tree, path ) => deepCopyLocksTreePath( tree, path ),
				{
					locks: [],
					children: {},
				}
			),
		},
	};
}
