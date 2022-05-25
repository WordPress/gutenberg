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
			requests: [ 1, 2, 3 ],
		} );

		expect( getPendingLockRequests( state ) ).toEqual( [ 1, 2, 3 ] );
	} );
} );

describe( 'isLockAvailable', () => {
	describe( 'smoke tests', () => {
		it( 'returns true if lock is available', () => {
			const state = deepFreeze( {
				tree: {
					children: {},
					locks: [],
				},
			} );

			expect(
				isLockAvailable( state, 'core', [], {
					exclusive: true,
				} )
			).toBe( true );
		} );
		it( 'returns false if lock is not available', () => {
			const state = deepFreeze( {
				tree: {
					children: {},
					locks: [ { exclusive: false } ],
				},
			} );

			expect(
				isLockAvailable( state, 'core', [], {
					exclusive: true,
				} )
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

		it( `returns true if another branch holds a locks (1)`, () => {
			appendLock( state, 'core', [ 'queries' ], {
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

		it( `returns true if another branch holds a locks (2)`, () => {
			appendLock( state, 'vendor', [], {
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

		it( `returns true if another branch holds a locks (3)`, () => {
			const subState = {
				tree: {
					locks: [],
					children: {
						postType: {
							locks: [],
							children: {
								post: {
									locks: [],
									children: {
										16: {
											locks: [
												{
													store: 'core',
													path: [
														'entities',
														'records',
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
										17: {
											locks: [],
											children: {},
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

		it( `returns true if another branch holds a locks (4)`, () => {
			const subState = {
				tree: {
					locks: [],
					children: {
						core: {
							locks: [],
							children: {
								entities: {
									locks: [],
									children: {
										records: {
											locks: [],
											children: {
												postType: {
													locks: [],
													children: {
														book: {
															locks: [],
															children: {
																67: {
																	locks: [
																		{
																			path: [
																				'core',
																				'entities',
																				'records',
																				'postType',
																				'book',
																				67,
																			],
																			exclusive: true,
																		},
																	],
																	children: {},
																},
															},
														},
													},
												},
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
					[ 'entities', 'records', 'postType', 'book', 67 ],
					{ exclusive: false }
				)
			).toBe( false );
		} );

		[ true, false ].forEach( ( exclusive ) => {
			it( `returns true if the path is not accessible and no parent holds a lock`, () => {
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'fake', 'path' ],
						{ exclusive: true }
					)
				).toBe( true );
			} );

			it( `returns false if the path is not accessible and any parent holds a lock`, () => {
				appendLock( state, 'core', [], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'fake', 'path' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if top-level parent already has a lock with exclusive=${ exclusive }`, () => {
				appendLock( state, 'core', [], {
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
				appendLock( state, 'core', [ 'entities' ], {
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
				appendLock( state, 'core', [ 'entities', 'root' ], {
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
					'core',
					[ 'entities', 'root', 'template_part' ],
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
					'core',
					[ 'entities', 'root', 'template_part', '3' ],
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
				appendLock( state, 'core', [], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						'core',
						[ 'fake', 'path' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if top-level parent already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, 'core', [], {
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
				appendLock( state, 'core', [ 'entities' ], {
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
				appendLock( state, 'core', [ 'entities', 'root' ], {
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
					'core',
					[ 'entities', 'root', 'template_part' ],
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
					'core',
					[ 'entities', 'root', 'template_part', '3' ],
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

function appendLock( state, store, path, lock ) {
	getNode( state.tree, [ store, ...path ] ).locks.push( lock );
}

function buildState( paths ) {
	return {
		requests: [],
		tree: paths.reduce(
			( tree, path ) => deepCopyLocksTreePath( tree, path ),
			{
				locks: [],
				children: {},
			}
		),
	};
}
