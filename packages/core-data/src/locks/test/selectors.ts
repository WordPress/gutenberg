import { beforeEach, describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import { getPendingLockRequests, isLockAvailable } from '../selectors';
import { deepCopyLocksTreePath, getNode } from '../utils';
import type { Lock, LockNode, LockPath, LocksState } from '../types';

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

describe( 'getPendingLockRequests', () => {
	it( 'returns pending lock requests', () => {
		const state = frozen< LocksState >( {
			// @ts-expect-error The selector returns the requests, whatever they hold.
			requests: [ 1, 2, 3 ],
		} );

		expect( getPendingLockRequests( state ) ).toEqual( [ 1, 2, 3 ] );
	} );
} );

describe( 'isLockAvailable', () => {
	describe( 'smoke tests', () => {
		it( 'returns true if lock is available', () => {
			const state = frozen< LocksState >( {
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
			const state = frozen< LocksState >( {
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
		let state: LocksState;
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
					frozen< LocksState >( state ),
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
					frozen< LocksState >( state ),
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
					frozen< LocksState >( state ),
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
					frozen< LocksState >( subState ),
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
																	children:
																		{},
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
					frozen< LocksState >( subState ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );
		} );
	} );

	describe( 'Advanced cases - shared lock', () => {
		let state: LocksState;
		beforeEach( () => {
			state = buildState( [
				[ 'core', 'entities', 'root', 'template_part', '3' ],
			] );
		} );
		it( `returns true if no parent or descendant has any locks`, () => {
			expect(
				isLockAvailable(
					frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
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
						frozen< LocksState >( state ),
						'core',
						[ 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );
		} );
	} );
} );

function appendLock(
	state: LocksState,
	store: string,
	path: LockPath,
	lock: DeepPartial< Lock >
) {
	// The tests lock nodes that `buildState` created.
	getNode( state.tree, [ store, ...path ] )!.locks.push(
		partial< Lock >( lock )
	);
}

function buildState( paths: LockPath[] ): LocksState {
	return {
		requests: [],
		tree: paths.reduce< LockNode >(
			( tree, path ) => deepCopyLocksTreePath( tree, path ),
			{
				locks: [],
				children: {},
			}
		),
	};
}
