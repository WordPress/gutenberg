/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	terms,
	entities,
	embedPreviews,
	userPermissions,
	autosaves,
	currentUser,
} from '../reducer';

describe( 'terms()', () => {
	it( 'returns an empty object by default', () => {
		const state = terms( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received terms', () => {
		const originalState = deepFreeze( {} );
		const state = terms( originalState, {
			type: 'RECEIVE_TERMS',
			taxonomy: 'categories',
			terms: [ { id: 1 } ],
		} );

		expect( state ).toEqual( {
			categories: [ { id: 1 } ],
		} );
	} );
} );

describe( 'entities', () => {
	// See also unit tests at `queried-data/test/reducer.js`, which are more
	// thorough in testing the behavior of what is tracked here as the
	// `queriedData` property on a kind/name nested object pair.

	it( 'returns the default state for all defined entities', () => {
		const state = entities( undefined, {} );

		expect( state.records.root.postType.queriedData ).toEqual( {
			items: {},
			queries: {},
			itemIsComplete: {},
		} );
	} );

	it( 'returns with received post types by slug', () => {
		const originalState = deepFreeze( {} );
		const state = entities( originalState, {
			type: 'RECEIVE_ITEMS',
			items: [
				{ slug: 'b', title: 'beach' },
				{ slug: 's', title: 'sun' },
			],
			kind: 'root',
			name: 'postType',
		} );

		expect( state.records.root.postType.queriedData ).toEqual( {
			items: {
				default: {
					b: { slug: 'b', title: 'beach' },
					s: { slug: 's', title: 'sun' },
				},
			},
			itemIsComplete: {
				default: {
					b: true,
					s: true,
				},
			},
			queries: {},
		} );
	} );

	it( 'appends the received post types by slug', () => {
		const originalState = deepFreeze( {
			records: {
				root: {
					postType: {
						queriedData: {
							items: {
								default: {
									w: { slug: 'w', title: 'water' },
								},
							},
							itemIsComplete: {
								default: {
									w: true,
								},
							},
							queries: {},
						},
					},
				},
			},
		} );
		const state = entities( originalState, {
			type: 'RECEIVE_ITEMS',
			items: [ { slug: 'b', title: 'beach' } ],
			kind: 'root',
			name: 'postType',
		} );

		expect( state.records.root.postType.queriedData ).toEqual( {
			items: {
				default: {
					w: { slug: 'w', title: 'water' },
					b: { slug: 'b', title: 'beach' },
				},
			},
			itemIsComplete: {
				default: {
					w: true,
					b: true,
				},
			},
			queries: {},
		} );
	} );

	it( 'returns with updated entities config', () => {
		const originalState = deepFreeze( {} );
		const state = entities( originalState, {
			type: 'ADD_ENTITIES',
			entities: [ { kind: 'postType', name: 'posts' } ],
		} );

		expect(
			Object.entries( state.config )
				.filter( ( [ , cfg ] ) => cfg.kind === 'postType' )
				.map( ( [ , cfg ] ) => cfg )
		).toEqual( [ { kind: 'postType', name: 'posts' } ] );
	} );

	describe( 'entity revisions', () => {
		const stateWithConfig = entities( undefined, {
			type: 'ADD_ENTITIES',
			entities: [
				{
					kind: 'root',
					name: 'postType',
					supports: { revisions: true },
				},
			],
		} );
		it( 'appends revisions state', () => {
			expect( stateWithConfig.records.root.postType ).toHaveProperty(
				'revisions',
				{}
			);
		} );

		it( 'returns with received revisions', () => {
			const initialState = deepFreeze( {
				config: stateWithConfig.config,
				records: {},
			} );
			const state = entities( initialState, {
				type: 'RECEIVE_ITEM_REVISIONS',
				items: [ { id: 1, parent: 2 } ],
				kind: 'root',
				name: 'postType',
				recordKey: 2,
			} );
			expect( state.records.root.postType.revisions ).toEqual( {
				2: {
					items: {
						default: {
							1: { id: 1, parent: 2 },
						},
					},
					itemIsComplete: {
						default: {
							1: true,
						},
					},
					queries: {},
				},
			} );
		} );

		it( 'returns with appended received revisions at the parent level', () => {
			const initialState = deepFreeze( {
				config: stateWithConfig.config,
				records: {
					root: {
						postType: {
							revisions: {
								2: {
									items: {
										default: {
											1: { id: 1, parent: 2 },
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
			const state = entities( initialState, {
				type: 'RECEIVE_ITEM_REVISIONS',
				items: [ { id: 3, parent: 4 } ],
				kind: 'root',
				name: 'postType',
				recordKey: 4,
			} );
			expect( state.records.root.postType.revisions ).toEqual( {
				2: {
					items: {
						default: {
							1: { id: 1, parent: 2 },
						},
					},
					itemIsComplete: {
						default: {
							1: true,
						},
					},
					queries: {},
				},
				4: {
					items: {
						default: {
							3: { id: 3, parent: 4 },
						},
					},
					itemIsComplete: {
						default: {
							3: true,
						},
					},
					queries: {},
				},
			} );
		} );

		it( 'returns with appended received revision items', () => {
			const initialState = deepFreeze( {
				config: stateWithConfig.config,
				records: {
					root: {
						postType: {
							revisions: {
								2: {
									items: {
										default: {
											1: { id: 1, parent: 2 },
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
			const state = entities( initialState, {
				type: 'RECEIVE_ITEM_REVISIONS',
				items: [ { id: 7, parent: 2 } ],
				kind: 'root',
				name: 'postType',
				recordKey: 2,
			} );
			expect( state.records.root.postType.revisions ).toEqual( {
				2: {
					items: {
						default: {
							1: { id: 1, parent: 2 },
							7: { id: 7, parent: 2 },
						},
					},
					itemIsComplete: {
						default: {
							1: true,
							7: true,
						},
					},
					queries: {},
				},
			} );
		} );

		it( 'returns with removed revision items', () => {
			const initialState = deepFreeze( {
				config: stateWithConfig.config,
				records: {
					root: {
						postType: {
							revisions: {
								2: {
									items: {
										default: {
											1: { id: 1, parent: 2 },
										},
									},
									itemIsComplete: {
										default: {
											1: true,
										},
									},
									queries: {},
								},
								4: {
									items: {
										default: {
											3: { id: 3, parent: 4 },
										},
									},
									itemIsComplete: {
										default: {
											3: true,
										},
									},
									queries: {},
								},
								6: {
									items: {
										default: {
											9: { id: 11, parent: 6 },
										},
									},
									itemIsComplete: {
										default: {
											9: true,
										},
									},
									queries: {},
								},
							},
						},
					},
				},
			} );
			const state = entities( initialState, {
				type: 'REMOVE_ITEMS',
				itemIds: [ 4, 6 ],
				kind: 'root',
				name: 'postType',
			} );
			expect( state.records.root.postType.revisions ).toEqual( {
				2: {
					items: {
						default: {
							1: { id: 1, parent: 2 },
						},
					},
					itemIsComplete: {
						default: {
							1: true,
						},
					},
					queries: {},
				},
			} );
		} );
	} );
} );

describe( 'embedPreviews()', () => {
	it( 'returns an empty object by default', () => {
		const state = embedPreviews( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received preview', () => {
		const originalState = deepFreeze( {} );
		const state = embedPreviews( originalState, {
			type: 'RECEIVE_EMBED_PREVIEW',
			url: 'http://twitter.com/notnownikki',
			preview: { data: 42 },
		} );

		expect( state ).toEqual( {
			'http://twitter.com/notnownikki': { data: 42 },
		} );
	} );
} );

describe( 'userPermissions()', () => {
	it( 'defaults to an empty object', () => {
		const state = userPermissions( undefined, {} );
		expect( state ).toEqual( {} );
	} );

	it( 'updates state with whether an action is allowed', () => {
		const original = deepFreeze( {
			'create/media': false,
		} );

		const state = userPermissions( original, {
			type: 'RECEIVE_USER_PERMISSION',
			key: 'create/media',
			isAllowed: true,
		} );

		expect( state ).toEqual( {
			'create/media': true,
		} );
	} );
} );

describe( 'autosaves', () => {
	it( 'returns an empty object by default', () => {
		const state = autosaves( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns the current state with the new autosaves merged in, keyed by the parent post id', () => {
		const existingAutosaves = [
			{
				title: {
					raw: 'Some',
				},
				content: {
					raw: 'other',
				},
				excerpt: {
					raw: 'autosave',
				},
				status: 'publish',
			},
		];

		const newAutosaves = [
			{
				title: {
					raw: 'The Title',
				},
				content: {
					raw: 'The Content',
				},
				excerpt: {
					raw: 'The Excerpt',
				},
				status: 'draft',
			},
		];

		const state = autosaves(
			{ 1: existingAutosaves },
			{
				type: 'RECEIVE_AUTOSAVES',
				postId: 2,
				autosaves: newAutosaves,
			}
		);

		expect( state ).toEqual( {
			1: existingAutosaves,
			2: newAutosaves,
		} );
	} );

	it( 'overwrites any existing state if new autosaves are received with the same post id', () => {
		const existingAutosaves = [
			{
				title: {
					raw: 'Some',
				},
				content: {
					raw: 'other',
				},
				excerpt: {
					raw: 'autosave',
				},
				status: 'publish',
			},
		];

		const newAutosaves = [
			{
				title: {
					raw: 'The Title',
				},
				content: {
					raw: 'The Content',
				},
				excerpt: {
					raw: 'The Excerpt',
				},
				status: 'draft',
			},
		];

		const state = autosaves(
			{ 1: existingAutosaves },
			{
				type: 'RECEIVE_AUTOSAVES',
				postId: 1,
				autosaves: newAutosaves,
			}
		);

		expect( state ).toEqual( {
			1: newAutosaves,
		} );
	} );
} );

describe( 'currentUser', () => {
	it( 'returns an empty object by default', () => {
		const state = currentUser( undefined, {} );
		expect( state ).toEqual( {} );
	} );

	it( 'returns the current user', () => {
		const currentUserData = { id: 1 };

		const state = currentUser(
			{},
			{
				type: 'RECEIVE_CURRENT_USER',
				currentUser: currentUserData,
			}
		);

		expect( state ).toEqual( currentUserData );
	} );

	it( 'overwrites any existing current user state', () => {
		const currentUserData = { id: 2 };

		const state = currentUser(
			{ id: 1 },
			{
				type: 'RECEIVE_CURRENT_USER',
				currentUser: currentUserData,
			}
		);

		expect( state ).toEqual( currentUserData );
	} );
} );
