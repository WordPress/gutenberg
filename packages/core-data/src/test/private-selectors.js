/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getPersistedIdMap,
	getStagedEntityRecords,
} from '../private-selectors';
import { getEditedEntityRecord } from '../selectors';
import { STAGED_ID_PREFIX } from '../utils/is-staged-id';

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
		};
		const persistedRecord = {
			id: 1,
			title: 'Persisted Post',
			status: 'publish',
		};

		const state = deepFreeze( {
			entities: {
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

	it( 'filters out staged records when their persisted counterpart exists', () => {
		const stagedRecord = {
			id: draftId,
			title: 'Staged Post',
			status: 'draft',
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
										[ draftId ]: stagedRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
									},
								},
								queries: {
									default: {
										'': { itemIds: [ 10 ] },
									},
								},
								persistedIdMap: {
									default: { 10: draftId },
								},
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

	it( 'filters out staged records that already exist in query results', () => {
		const stagedRecord = {
			id: draftId,
			title: 'Staged Post',
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
										[ draftId ]: stagedRecord,
									},
								},
								itemIsComplete: {
									default: {
										[ draftId ]: true,
									},
								},
								queries: {
									default: {
										'': { itemIds: [ draftId ] },
									},
								},
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

describe( 'getPersistedIdMap', () => {
	it( 'returns the persisted ID map for the requested context', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
							queriedData: {
								items: {},
								itemIsComplete: {},
								queries: {},
								persistedIdMap: {
									default: { 10: '__staged__1' },
									edit: { 12: '__staged__2' },
								},
							},
						},
					},
				},
			},
		} );

		expect( getPersistedIdMap( state, 'root', 'postType' ) ).toEqual( {
			10: '__staged__1',
		} );
		expect(
			getPersistedIdMap( state, 'root', 'postType', {
				context: 'edit',
			} )
		).toEqual( {
			12: '__staged__2',
		} );
	} );
} );

describe( 'getEditedEntityRecord with staged records', () => {
	const draftId = `${ STAGED_ID_PREFIX }test-uuid`;

	it( 'should merge edits with staged record', () => {
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
	} );
} );
