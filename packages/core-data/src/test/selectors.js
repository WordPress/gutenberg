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
	getEmbedPreview,
	isPreviewEmbedFallback,
	canUser,
	getAutosaves,
} from '../selectors';

describe( 'getEntityRecord', () => {
	it( 'should return undefined for unknown record’s key', () => {
		const state = deepFreeze( {
			entities: {
				data: {
					root: {
						postType: {
							items: {},
							queries: {},
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
							items: {
								post: { slug: 'post' },
							},
							queries: {},
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
							items: {},
							queries: {},
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
		} );
		expect( getEntityRecords( state, 'root', 'postType' ) ).toEqual( [
			{ slug: 'post' },
			{ slug: 'page' },
		] );
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
