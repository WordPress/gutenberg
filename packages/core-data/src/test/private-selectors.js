/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getEntityRecordsWithStaged,
	getStagedEntityRecords,
} from '../private-selectors';
import { getEditedEntityRecord } from '../selectors';
import { STAGED_ID_PREFIX } from '../utils';

describe( 'getStagedEntityRecords', () => {
	const draftId = `${ STAGED_ID_PREFIX }test-uuid`;

	it( 'should return empty array when no records exist', () => {
		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {},
								itemIsComplete: {},
								queries: {},
							},
						},
					},
				},
			},
		} );

		expect( getStagedEntityRecords( state, 'postType', 'post' ) ).toEqual(
			[]
		);
	} );

	it( 'should return only staged records', () => {
		const draftRecord = {
			id: draftId,
			title: 'Draft Post',
			status: 'draft',
			__unstableIsStaged: true,
		};
		const persistedRecord = {
			id: 1,
			title: 'Persisted Post',
			status: 'publish',
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord,
										1: persistedRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
										1: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );

		const result = getStagedEntityRecords( state, 'postType', 'post' );
		expect( result ).toEqual( [ draftRecord ] );
		expect( result ).not.toContainEqual( persistedRecord );
	} );

	it( 'keeps staged records until persisted records are present', () => {
		const draftRecord = {
			id: draftId,
			title: 'Draft Post',
			status: 'draft',
			__unstableIsStaged: true,
			__unstablePersistedId: 10,
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );

		expect( getStagedEntityRecords( state, 'postType', 'post' ) ).toEqual( [
			draftRecord,
		] );
	} );

	it( 'clears staged records once persisted records are present', () => {
		const stagedRecord = {
			id: draftId,
			title: 'Staged Post',
			status: 'draft',
			__unstableIsStaged: true,
			__unstablePersistedId: 10,
		};
		const persistedRecord = {
			id: 10,
			title: 'Persisted Post',
			status: 'publish',
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: stagedRecord,
										10: persistedRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
										10: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );

		expect( getStagedEntityRecords( state, 'postType', 'post' ) ).toEqual(
			[]
		);
	} );

	it( 'should return multiple staged records', () => {
		const draftId2 = `${ STAGED_ID_PREFIX }test-uuid-2`;
		const draftRecord1 = {
			id: draftId,
			title: 'Draft Post 1',
			__unstableIsStaged: true,
		};
		const draftRecord2 = {
			id: draftId2,
			title: 'Draft Post 2',
			__unstableIsStaged: true,
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord1,
										[ draftId2 ]: draftRecord2,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
										[ draftId2 ]: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );

		const result = getStagedEntityRecords( state, 'postType', 'post' );
		expect( result ).toHaveLength( 2 );
		expect( result ).toContainEqual( draftRecord1 );
		expect( result ).toContainEqual( draftRecord2 );
	} );

	it( 'should return empty array when only persisted records exist', () => {
		const persistedRecord = {
			id: 1,
			title: 'Persisted Post',
			status: 'publish',
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										1: persistedRecord,
									},
								},
								itemIsComplete: {
									default: {
										1: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );

		expect( getStagedEntityRecords( state, 'postType', 'post' ) ).toEqual(
			[]
		);
	} );
} );

describe( 'getEntityRecordsWithStaged', () => {
	const draftId = `${ STAGED_ID_PREFIX }test-uuid`;

	it( 'should return null when no records exist', () => {
		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {},
								itemIsComplete: {},
								queries: {},
							},
						},
					},
				},
			},
		} );

		expect(
			getEntityRecordsWithStaged( state, 'postType', 'post', {} )
		).toBeNull();
	} );

	it( 'should return only staged records when no queried records exist', () => {
		const draftRecord = {
			id: draftId,
			title: 'Draft Post',
			status: 'draft',
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );

		const result = getEntityRecordsWithStaged(
			state,
			'postType',
			'post',
			{}
		);
		expect( result ).toEqual( [ draftRecord ] );
	} );

	it( 'should include staged records alongside queried records', () => {
		const draftRecord = {
			id: draftId,
			title: 'Draft Post',
			status: 'draft',
		};
		const persistedRecord = {
			id: 1,
			title: 'Persisted Post',
			status: 'publish',
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord,
										1: persistedRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
										1: true,
									},
								},
								queries: {
									default: {
										'': {
											itemIds: [ 1 ],
											meta: {},
										},
									},
								},
							},
						},
					},
				},
			},
		} );

		const result = getEntityRecordsWithStaged(
			state,
			'postType',
			'post',
			{}
		);
		// Staged records should be first
		expect( result ).toEqual( [ draftRecord, persistedRecord ] );
	} );

	it( 'should not duplicate staged records that are somehow in both', () => {
		const draftRecord = {
			id: draftId,
			title: 'Draft Post',
			status: 'draft',
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
									},
								},
								queries: {
									default: {
										'': {
											// Draft is also in the query result
											itemIds: [ draftId ],
											meta: {},
										},
									},
								},
							},
						},
					},
				},
			},
		} );

		const result = getEntityRecordsWithStaged(
			state,
			'postType',
			'post',
			{}
		);
		// Should only appear once
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).toEqual( draftRecord );
	} );

	it( 'should return regular records when no staged records exist', () => {
		const persistedRecord = {
			id: 1,
			title: 'Persisted Post',
			status: 'publish',
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										1: persistedRecord,
									},
								},
								itemIsComplete: {
									default: {
										1: true,
									},
								},
								queries: {
									default: {
										'': {
											itemIds: [ 1 ],
											meta: {},
										},
									},
								},
							},
						},
					},
				},
			},
		} );

		const result = getEntityRecordsWithStaged(
			state,
			'postType',
			'post',
			{}
		);
		expect( result ).toEqual( [ persistedRecord ] );
	} );
} );

describe( 'getEditedEntityRecord with staged records', () => {
	const draftId = `${ STAGED_ID_PREFIX }test-uuid`;

	it( 'should return staged record by ID', () => {
		const draftRecord = {
			id: draftId,
			title: 'Draft Post',
			status: 'draft',
			__unstableIsStaged: true,
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
									},
								},
								queries: {},
							},
							edits: {},
						},
					},
				},
			},
		} );

		const result = getEditedEntityRecord(
			state,
			'postType',
			'post',
			draftId
		);
		expect( result ).toEqual( draftRecord );
		expect( result.__unstableIsStaged ).toBe( true );
	} );

	it( 'should merge edits with staged record', () => {
		const draftRecord = {
			id: draftId,
			title: 'Draft Post',
			status: 'draft',
			__unstableIsStaged: true,
		};

		const state = deepFreeze( {
			entities: {
				config: [ { kind: 'postType', name: 'post', key: 'id' } ],
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										[ draftId ]: draftRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
									},
								},
								queries: {},
							},
							edits: {
								[ draftId ]: {
									title: 'Updated Draft Title',
								},
							},
						},
					},
				},
			},
		} );

		const result = getEditedEntityRecord(
			state,
			'postType',
			'post',
			draftId
		);
		expect( result.title ).toBe( 'Updated Draft Title' );
		expect( result.__unstableIsStaged ).toBe( true );
	} );
} );
