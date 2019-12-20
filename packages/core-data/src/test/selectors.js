/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getEntityRecord,
	getEntityRecords,
	getEntityRecordChangesByRecord,
	getEntityRecordNonTransientEdits,
	getEmbedPreview,
	isPreviewEmbedFallback,
	canUser,
	getAutosave,
	getAutosaves,
	getCurrentUser,
	getReferenceByDistinctEdits,
} from '../selectors';

describe( 'getEntityRecord', () => {
	it( 'should return undefined for unknown record’s key', () => {
		const state = deepFreeze( {
			entities: {
				data: {
					root: {
						postType: {
							queriedData: {
								items: {},
								queries: {},
							},
						},
					},
				},
			},
		} );
		expect( getEntityRecord( state, 'root', 'postType', 'post' ) ).toBe( undefined );
	} );

	it( 'should return a record by key', () => {
		const state = deepFreeze( {
			entities: {
				data: {
					root: {
						postType: {
							queriedData: {
								items: {
									post: { slug: 'post' },
								},
								queries: {},
							},
						},
					},
				},
			},
		} );
		expect( getEntityRecord( state, 'root', 'postType', 'post' ) ).toEqual( { slug: 'post' } );
	} );
} );

describe( 'getEntityRecords', () => {
	it( 'should return an null by default', () => {
		const state = deepFreeze( {
			entities: {
				data: {
					root: {
						postType: {
							queriedData: {
								items: {},
								queries: {},
							},
						},
					},
				},
			},
		} );
		expect( getEntityRecords( state, 'root', 'postType' ) ).toBe( null );
	} );

	it( 'should return all the records', () => {
		const state = deepFreeze( {
			entities: {
				data: {
					root: {
						postType: {
							queriedData: {
								items: {
									post: { slug: 'post' },
									page: { slug: 'page' },
								},
								queries: {
									'': [ 'post', 'page' ],
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
} );

describe( 'getEntityRecordChangesByRecord', () => {
	it( 'should return a map of objects with each raw edited entity record and its corresponding edits', () => {
		const state = deepFreeze( {
			entities: {
				config: [
					{
						kind: 'someKind',
						name: 'someName',
						transientEdits: { someTransientEditProperty: true },
					},
				],
				data: {
					someKind: {
						someName: {
							queriedData: {
								items: {
									someKey: {
										someProperty: 'somePersistedValue',
										someRawProperty: { raw: 'somePersistedRawValue' },
									},
								},
							},
							edits: {
								someKey: {
									someProperty: 'someEditedValue',
									someRawProperty: 'someEditedRawValue',
									someTransientEditProperty: 'someEditedTransientEditValue',
								},
							},
						},
					},
				},
			},
		} );
		expect( getEntityRecordChangesByRecord( state ) ).toEqual( {
			someKind: {
				someName: {
					someKey: {
						rawRecord: {
							someProperty: 'somePersistedValue',
							someRawProperty: 'somePersistedRawValue',
						},
						edits: {
							someProperty: 'someEditedValue',
							someRawProperty: 'someEditedRawValue',
						},
					},
				},
			},
		} );
	} );
} );

describe( 'getEntityRecordNonTransientEdits', () => {
	it( 'should return an empty object when the entity does not have a loaded config.', () => {
		const state = deepFreeze( {
			entities: { config: [], data: {} },
		} );
		expect(
			getEntityRecordNonTransientEdits( state, 'someKind', 'someName', 'someId' )
		).toEqual( {} );
	} );
} );

describe( 'getEmbedPreview()', () => {
	it( 'returns preview stored for url', () => {
		let state = deepFreeze( {
			embedPreviews: {},
		} );
		expect( getEmbedPreview( state, 'http://example.com/' ) ).toBe( undefined );

		state = deepFreeze( {
			embedPreviews: {
				'http://example.com/': { data: 42 },
			},
		} );
		expect( getEmbedPreview( state, 'http://example.com/' ) ).toEqual( { data: 42 } );
	} );
} );

describe( 'isPreviewEmbedFallback()', () => {
	it( 'returns true if the preview html is just a single link', () => {
		const state = deepFreeze( {
			embedPreviews: {
				'http://example.com/': { html: '<a href="http://example.com/">http://example.com/</a>' },
			},
		} );
		expect( isPreviewEmbedFallback( state, 'http://example.com/' ) ).toEqual( true );
	} );
} );

describe( 'canUser', () => {
	it( 'returns undefined by default', () => {
		const state = deepFreeze( {
			userPermissions: {},
		} );
		expect( canUser( state, 'create', 'media' ) ).toBe( undefined );
	} );

	it( 'returns whether an action can be performed', () => {
		const state = deepFreeze( {
			userPermissions: {
				'create/media': false,
			},
		} );
		expect( canUser( state, 'create', 'media' ) ).toBe( false );
	} );

	it( 'returns whether an action can be performed for a given resource', () => {
		const state = deepFreeze( {
			userPermissions: {
				'create/media/123': false,
			},
		} );
		expect( canUser( state, 'create', 'media', 123 ) ).toBe( false );
	} );
} );

describe( 'getAutosave', () => {
	const testAutosave = { author: 1, title: { raw: '' }, excerpt: { raw: '' }, content: { raw: '' } };

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
		const expectedAutosave = { author, title: { raw: '' }, excerpt: { raw: '' }, content: { raw: '' } };
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
		const autosaves = [ { title: { raw: '' }, excerpt: { raw: '' }, content: { raw: '' } } ];
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
		const autosaves = [ { title: { raw: '' }, excerpt: { raw: '' }, content: { raw: '' } } ];
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

describe( 'getReferenceByDistinctEdits', () => {
	it( 'should return referentially equal values across empty states', () => {
		const state = { undo: [] };
		expect( getReferenceByDistinctEdits( state ) ).toBe( getReferenceByDistinctEdits( state ) );

		const beforeState = { undo: [] };
		const afterState = { undo: [] };
		expect( getReferenceByDistinctEdits( beforeState ) ).toBe( getReferenceByDistinctEdits( afterState ) );
	} );

	it( 'should return referentially equal values across unchanging non-empty state', () => {
		const undoStates = [ {} ];
		const state = { undo: undoStates };
		expect( getReferenceByDistinctEdits( state ) ).toBe( getReferenceByDistinctEdits( state ) );

		const beforeState = { undo: undoStates };
		const afterState = { undo: undoStates };
		expect( getReferenceByDistinctEdits( beforeState ) ).toBe( getReferenceByDistinctEdits( afterState ) );
	} );

	describe( 'when adding edits', () => {
		it( 'should return referentially different values across changing states', () => {
			const beforeState = { undo: [ {} ] };
			beforeState.undo.offset = 0;
			const afterState = { undo: [ {}, {} ] };
			afterState.undo.offset = 1;
			expect( getReferenceByDistinctEdits( beforeState ) ).not.toBe( getReferenceByDistinctEdits( afterState ) );
		} );
	} );

	describe( 'when using undo', () => {
		it( 'should return referentially different values across changing states', () => {
			const beforeState = { undo: [ {}, {} ] };
			beforeState.undo.offset = 1;
			const afterState = { undo: [ {}, {} ] };
			afterState.undo.offset = 0;
			expect( getReferenceByDistinctEdits( beforeState ) ).not.toBe( getReferenceByDistinctEdits( afterState ) );
		} );
	} );
} );

