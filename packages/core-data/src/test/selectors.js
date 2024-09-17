/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getEntityRecord,
	__experimentalGetEntityRecordNoResolver,
	hasEntityRecords,
	getEntityRecords,
	getRawEntityRecord,
	__experimentalGetDirtyEntityRecords,
	__experimentalGetEntitiesBeingSaved,
	getEntityRecordNonTransientEdits,
	getEmbedPreview,
	isPreviewEmbedFallback,
	canUser,
	getAutosave,
	getAutosaves,
	getCurrentUser,
	getRevisions,
	getRevision,
} from '../selectors';
// getEntityRecord and __experimentalGetEntityRecordNoResolver selectors share the same tests.
describe.each( [
	[ getEntityRecord ],
	[ __experimentalGetEntityRecordNoResolver ],
] )( '%p', ( selector ) => {
	describe( 'normalizing Post ID passed as recordKey', () => {
		it( 'normalizes any Post ID recordKey argument to a Number via `__unstableNormalizeArgs` method', async () => {
			const normalized = getEntityRecord.__unstableNormalizeArgs( [
				'postType',
				'some_post',
				'123',
			] );
			expect( normalized ).toEqual( [ 'postType', 'some_post', 123 ] );
		} );

		it( 'does not normalize recordKey argument unless it is a Post ID', async () => {
			const normalized = getEntityRecord.__unstableNormalizeArgs( [
				'postType',
				'some_post',
				'i-am-a-slug-with-a-number-123',
			] );
			expect( normalized ).toEqual( [
				'postType',
				'some_post',
				'i-am-a-slug-with-a-number-123',
			] );
		} );
	} );
	it( 'should return undefined for unknown entity kind, name', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
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
		expect( selector( state, 'foo', 'bar', 'baz' ) ).toBeUndefined();
	} );

	it( 'should return undefined for unknown record’s key', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
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
		expect( selector( state, 'root', 'postType', 'post' ) ).toBeUndefined();
	} );

	it( 'should return a record by key', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
							queriedData: {
								items: {
									default: {
										post: { slug: 'post' },
									},
								},
								itemIsComplete: {
									default: {
										post: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );
		expect( selector( state, 'root', 'postType', 'post' ) ).toEqual( {
			slug: 'post',
		} );
	} );

	it( 'should return null if no item received, filtered item requested', () => {} );

	it( 'should return filtered item if incomplete item received, filtered item requested', () => {} );

	it( 'should return null if incomplete item received, complete item requested', () => {} );

	it( 'should return filtered item if complete item received, filtered item requested', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										1: {
											id: 1,
											content: 'chicken',
											author: 'bob',
										},
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
		expect(
			getEntityRecord( state, 'postType', 'post', 1, {
				_fields: 'content',
			} )
		).toEqual( { content: 'chicken' } );
	} );

	it( 'should work well for nested fields properties', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
							queriedData: {
								items: {
									default: {
										post: {
											foo: undefined,
										},
									},
								},
								itemIsComplete: {
									default: {
										post: true,
									},
								},
								queries: {},
							},
						},
					},
				},
			},
		} );
		expect(
			getEntityRecord( state, 'root', 'postType', 'post', {
				_fields: [ 'foo.bar' ],
			} )
		).toEqual( {
			foo: {
				bar: undefined,
			},
		} );
	} );
} );

describe( 'hasEntityRecords', () => {
	it( 'returns false if entity records have not been received', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
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

		expect( hasEntityRecords( state, 'root', 'postType' ) ).toBe( false );
	} );

	it( 'returns false if the entity configuration is not known', () => {
		const state = deepFreeze( {
			entities: {
				records: {},
			},
		} );

		expect( hasEntityRecords( state, 'root', 'postType' ) ).toBe( false );
	} );

	it( 'returns true if entity records have been received', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
							queriedData: {
								items: {
									default: {
										post: { slug: 'post' },
										page: { slug: 'page' },
									},
								},
								itemIsComplete: {
									default: {
										post: true,
										page: true,
									},
								},
								queries: {
									default: {
										'': { itemIds: [ 'post', 'page' ] },
									},
								},
							},
						},
					},
				},
			},
		} );

		expect( hasEntityRecords( state, 'root', 'postType' ) ).toBe( true );
	} );
} );

describe( 'getRawEntityRecord', () => {
	const data = {
		someKind: {
			someName: {
				queriedData: {
					items: {
						default: {
							post: {
								title: {
									raw: { html: '<h1>post</h1>' },
									rendered:
										'<div id="post"><h1>rendered post</h1></div>',
								},
							},
						},
					},
					itemIsComplete: {
						default: {
							post: true,
						},
					},
					queries: {},
				},
			},
		},
	};
	it( 'should preserve the structure of `raw` field by default', () => {
		const state = deepFreeze( {
			entities: {
				config: [
					{
						kind: 'someKind',
						name: 'someName',
					},
				],
				records: { ...data },
			},
		} );
		expect(
			getRawEntityRecord( state, 'someKind', 'someName', 'post' )
		).toEqual( {
			title: {
				raw: { html: '<h1>post</h1>' },
				rendered: '<div id="post"><h1>rendered post</h1></div>',
			},
		} );
	} );
	it( 'should flatten the structure of `raw` field for entities configured with rawAttributes', () => {
		const state = deepFreeze( {
			entities: {
				config: [
					{
						kind: 'someKind',
						name: 'someName',
						rawAttributes: [ 'title' ],
					},
				],
				records: { ...data },
			},
		} );
		expect(
			getRawEntityRecord( state, 'someKind', 'someName', 'post' )
		).toEqual( {
			title: {
				html: '<h1>post</h1>',
			},
		} );
	} );
} );

describe( 'getEntityRecords', () => {
	it( 'should return null by default', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
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
		expect( getEntityRecords( state, 'root', 'postType' ) ).toBe( null );
	} );

	it( 'should return null for an unknown entity configuration', () => {
		const state = deepFreeze( {
			entities: {
				records: {},
			},
		} );

		expect( getEntityRecords( state, 'root', 'postType' ) ).toBe( null );
	} );

	it( 'should return all the records', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					root: {
						postType: {
							queriedData: {
								items: {
									default: {
										post: { slug: 'post' },
										page: { slug: 'page' },
									},
								},
								itemIsComplete: {
									default: {
										post: true,
										page: true,
									},
								},
								queries: {
									default: {
										'': { itemIds: [ 'post', 'page' ] },
									},
								},
							},
						},
					},
				},
			},
		} );
		expect( getEntityRecords( state, 'root', 'postType' ) ).toEqual( [
			{ slug: 'post' },
			{ slug: 'page' },
		] );
	} );

	it( 'should return filtered items', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					postType: {
						post: {
							queriedData: {
								items: {
									default: {
										1: {
											id: 1,
											content: 'chicken',
											author: 'bob',
										},
									},
								},
								itemIsComplete: {
									default: {
										1: true,
									},
								},
								queries: {
									default: {
										'_fields=id%2Ccontent': {
											itemIds: [ 1 ],
										},
									},
								},
							},
						},
					},
				},
			},
		} );
		expect(
			getEntityRecords( state, 'postType', 'post', {
				_fields: [ 'id', 'content' ],
			} )
		).toEqual( [ { id: 1, content: 'chicken' } ] );
	} );

	it( 'should return the same instance with the same arguments', () => {
		let state = deepFreeze( {
			entities: {
				records: {},
			},
		} );

		const postTypeFirstRecords = getEntityRecords(
			state,
			'root',
			'postType'
		);
		const wpBlockFirstRecords = getEntityRecords(
			state,
			'postType',
			'wp_block'
		);

		// Simulate update states.
		state = { ...state };

		const postTypeSecondRecords = getEntityRecords(
			state,
			'root',
			'postType'
		);
		const wpBlockSecondRecords = getEntityRecords(
			state,
			'postType',
			'wp_block'
		);

		expect( postTypeFirstRecords ).toBe( postTypeSecondRecords );
		expect( wpBlockFirstRecords ).toBe( wpBlockSecondRecords );
	} );
} );

describe( '__experimentalGetDirtyEntityRecords', () => {
	it( 'returns a map of objects with each raw edited entity record and its corresponding edits', () => {
		const state = deepFreeze( {
			entities: {
				config: [
					{
						kind: 'someKind',
						name: 'someName',
						transientEdits: { someTransientEditProperty: true },
					},
				],
				records: {
					someKind: {
						someName: {
							queriedData: {
								items: {
									default: {
										someKey: {
											someProperty: 'somePersistedValue',
											someRawProperty: {
												raw: 'somePersistedRawValue',
											},
											id: 'someKey',
										},
									},
								},
								itemIsComplete: {
									default: {
										someKey: true,
									},
								},
							},
							edits: {
								someKey: {
									someProperty: 'someEditedValue',
									someRawProperty: 'someEditedRawValue',
									someTransientEditProperty:
										'someEditedTransientEditValue',
								},
							},
						},
					},
				},
			},
		} );
		expect( __experimentalGetDirtyEntityRecords( state ) ).toEqual( [
			{ kind: 'someKind', name: 'someName', key: 'someKey', title: '' },
		] );
	} );

	it( 'excludes entity records that no longer exist', () => {
		const state = deepFreeze( {
			entities: {
				config: [
					{
						kind: 'someKind',
						name: 'someName',
						transientEdits: { someTransientEditProperty: true },
					},
				],
				records: {
					someKind: {
						someName: {
							queriedData: {
								items: {
									default: {
										someKey: {
											someProperty: 'somePersistedValue',
											someRawProperty: {
												raw: 'somePersistedRawValue',
											},
											id: 'someKey',
										},
									},
								},
								itemIsComplete: {
									default: {
										someKey: true,
									},
								},
							},
							edits: {
								someKey: {
									someProperty: 'someEditedValue',
									someRawProperty: 'someEditedRawValue',
									someTransientEditProperty:
										'someEditedTransientEditValue',
								},
								deletedKey: {
									someProperty: 'someEditedValue',
									someRawProperty: 'someEditedRawValue',
									someTransientEditProperty:
										'someEditedTransientEditValue',
								},
							},
						},
					},
				},
			},
		} );
		expect( __experimentalGetDirtyEntityRecords( state ) ).toEqual( [
			{ kind: 'someKind', name: 'someName', key: 'someKey', title: '' },
		] );
	} );
} );

describe( '__experimentalGetEntitiesBeingSaved', () => {
	it( "should return a map of objects with each raw entity record that's being saved", () => {
		const state = deepFreeze( {
			entities: {
				config: [
					{
						kind: 'someKind',
						name: 'someName',
						transientEdits: { someTransientEditProperty: true },
					},
				],
				records: {
					someKind: {
						someName: {
							queriedData: {
								items: {
									default: {
										someKey: {
											someProperty: 'somePersistedValue',
											someRawProperty: {
												raw: 'somePersistedRawValue',
											},
											id: 'someKey',
										},
									},
								},
								itemIsComplete: {
									default: {
										someKey: true,
									},
								},
							},
							saving: {
								someKey: {
									pending: true,
								},
							},
						},
					},
				},
			},
		} );
		expect( __experimentalGetEntitiesBeingSaved( state ) ).toEqual( [
			{ kind: 'someKind', name: 'someName', key: 'someKey', title: '' },
		] );
	} );
} );

describe( 'getEntityRecordNonTransientEdits', () => {
	it( 'should return an empty object when the entity does not have a loaded config.', () => {
		const state = deepFreeze( {
			entities: { config: [], records: {} },
		} );
		expect(
			getEntityRecordNonTransientEdits(
				state,
				'someKind',
				'someName',
				'someId'
			)
		).toEqual( {} );
	} );
} );

describe( 'getEmbedPreview()', () => {
	it( 'returns preview stored for url', () => {
		let state = deepFreeze( {
			embedPreviews: {},
		} );
		expect( getEmbedPreview( state, 'http://example.com/' ) ).toBe(
			undefined
		);

		state = deepFreeze( {
			embedPreviews: {
				'http://example.com/': { records: 42 },
			},
		} );
		expect( getEmbedPreview( state, 'http://example.com/' ) ).toEqual( {
			records: 42,
		} );
	} );
} );

describe( 'isPreviewEmbedFallback()', () => {
	it( 'returns true if the preview html is just a single link', () => {
		const state = deepFreeze( {
			embedPreviews: {
				'http://example.com/': {
					html: '<a href="http://example.com/">http://example.com/</a>',
				},
			},
		} );
		expect(
			isPreviewEmbedFallback( state, 'http://example.com/' )
		).toEqual( true );
	} );
} );

describe( 'canUser', () => {
	it( 'returns undefined by default', () => {
		const state = deepFreeze( {
			userPermissions: {},
		} );
		expect( canUser( state, 'create', 'media' ) ).toBe( undefined );
		expect(
			canUser( state, 'create', { kind: 'root', name: 'media' } )
		).toBe( undefined );
	} );

	it( 'returns null when entity kind or name is missing', () => {
		const state = deepFreeze( {
			userPermissions: {},
		} );
		expect( canUser( state, 'create', { name: 'media' } ) ).toBe( false );
		expect( canUser( state, 'create', { kind: 'root' } ) ).toBe( false );
	} );

	it( 'returns whether an action can be performed', () => {
		const state = deepFreeze( {
			userPermissions: {
				'create/media': false,
				'create/root/media': false,
			},
		} );
		expect( canUser( state, 'create', 'media' ) ).toBe( false );
		expect(
			canUser( state, 'create', { kind: 'root', name: 'media' } )
		).toBe( false );
	} );

	it( 'returns whether an action can be performed for a given resource', () => {
		const state = deepFreeze( {
			userPermissions: {
				'create/media/123': false,
				'create/root/media/123': false,
			},
		} );
		expect( canUser( state, 'create', 'media', 123 ) ).toBe( false );
		expect(
			canUser( state, 'create', { kind: 'root', name: 'media', id: 123 } )
		).toBe( false );
	} );
} );

describe( 'getAutosave', () => {
	const testAutosave = {
		author: 1,
		title: { raw: '' },
		excerpt: { raw: '' },
		content: { raw: '' },
	};

	it( 'returns undefined if no autosaves exist for the post id in state', () => {
		const postType = 'post';
		const postId = 2;
		const author = 2;
		const state = {
			autosaves: {
				1: [ testAutosave ],
				2: [ testAutosave ],
			},
		};

		const result = getAutosave( state, postType, postId, author );

		expect( result ).toBeUndefined();
	} );

	it( 'returns undefined if an authorId is not provided (or undefined)', () => {
		const postType = 'post';
		const postId = 1;
		const state = {
			autosaves: {
				1: [ testAutosave ],
			},
		};

		const result = getAutosave( state, postType, postId );

		expect( result ).toBeUndefined();
	} );

	it( 'returns undefined if there are autosaves for the post id, but none matching the autosave for the author', () => {
		const postType = 'post';
		const postId = 1;
		const author = 2;
		const state = {
			autosaves: {
				[ postId ]: [ testAutosave ],
				2: [ testAutosave ],
			},
		};

		const result = getAutosave( state, postType, postId, author );

		expect( result ).toBeUndefined();
	} );

	it( 'returns the autosave for the post id and author when it exists in state', () => {
		const postType = 'post';
		const postId = 1;
		const author = 2;
		const expectedAutosave = {
			author,
			title: { raw: '' },
			excerpt: { raw: '' },
			content: { raw: '' },
		};
		const state = {
			autosaves: {
				[ postId ]: [ testAutosave, expectedAutosave ],
				2: [ testAutosave ],
			},
		};

		const result = getAutosave( state, postType, postId, author );

		expect( result ).toEqual( expectedAutosave );
	} );
} );

describe( 'getAutosaves', () => {
	it( 'returns undefined for the provided post id if no autosaves exist for it in state', () => {
		const postType = 'post';
		const postId = 2;
		const autosaves = [
			{ title: { raw: '' }, excerpt: { raw: '' }, content: { raw: '' } },
		];
		const state = {
			autosaves: {
				1: autosaves,
			},
		};

		const result = getAutosaves( state, postType, postId );

		expect( result ).toBeUndefined();
	} );

	it( 'returns the autosaves for the provided post id when they exist in state', () => {
		const postType = 'post';
		const postId = 1;
		const autosaves = [
			{ title: { raw: '' }, excerpt: { raw: '' }, content: { raw: '' } },
		];
		const state = {
			autosaves: {
				1: autosaves,
			},
		};

		const result = getAutosaves( state, postType, postId );

		expect( result ).toEqual( autosaves );
	} );
} );

describe( 'getCurrentUser', () => {
	it( 'returns undefined if no user exists in state', () => {
		const state = {};

		expect( getCurrentUser( state ) ).toBeUndefined();
	} );

	it( 'returns the user object when a user exists in state', () => {
		const currentUser = {
			id: 1,
		};

		const state = {
			currentUser,
		};

		expect( getCurrentUser( state ) ).toEqual( currentUser );
	} );
} );

describe( 'getRevisions', () => {
	it( 'should return revisions', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					postType: {
						post: {
							revisions: {
								1: {
									items: {
										default: {
											10: {
												id: 10,
												content: 'chicken',
												author: 'bob',
												parent: 1,
											},
										},
									},
									itemIsComplete: {
										default: {
											10: true,
										},
									},
									queries: {
										default: {
											'': { itemIds: [ 10 ] },
										},
									},
								},
							},
						},
					},
				},
			},
		} );

		expect( getRevisions( state, 'postType', 'post', 1 ) ).toEqual( [
			{
				id: 10,
				content: 'chicken',
				author: 'bob',
				parent: 1,
			},
		] );
	} );
} );

describe( 'getRevision', () => {
	it( 'should return a specific revision', () => {
		const state = deepFreeze( {
			entities: {
				records: {
					postType: {
						post: {
							revisions: {
								1: {
									items: {
										default: {
											10: {
												id: 10,
												content: 'chicken',
												author: 'bob',
												parent: 1,
											},
										},
									},
									itemIsComplete: {
										default: {
											10: true,
										},
									},
									queries: {
										default: {
											'': [ 10 ],
										},
									},
								},
							},
						},
					},
				},
			},
		} );

		expect( getRevision( state, 'postType', 'post', 1, 10 ) ).toEqual( {
			id: 10,
			content: 'chicken',
			author: 'bob',
			parent: 1,
		} );
	} );
} );
