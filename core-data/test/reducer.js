/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { terms, media, models } from '../reducer';

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

	it( 'assigns requested taxonomy to null', () => {
		const originalState = deepFreeze( {} );
		const state = terms( originalState, {
			type: 'SET_REQUESTED',
			dataType: 'terms',
			subType: 'categories',
		} );

		expect( state ).toEqual( {
			categories: null,
		} );
	} );

	it( 'does not assign requested taxonomy to null if received', () => {
		const originalState = deepFreeze( {
			categories: [ { id: 1 } ],
		} );
		const state = terms( originalState, {
			type: 'SET_REQUESTED',
			dataType: 'terms',
			subType: 'categories',
		} );

		expect( state ).toEqual( {
			categories: [ { id: 1 } ],
		} );
	} );

	it( 'does not assign requested taxonomy if not terms data type', () => {
		const originalState = deepFreeze( {} );
		const state = terms( originalState, {
			type: 'SET_REQUESTED',
			dataType: 'foo',
			subType: 'categories',
		} );

		expect( state ).toEqual( {} );
	} );
} );

describe( 'media', () => {
	it( 'returns an empty object by default', () => {
		const state = media( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received media by id', () => {
		const originalState = deepFreeze( {} );
		const state = media( originalState, {
			type: 'RECEIVE_MEDIA',
			media: [ { id: 1, title: 'beach' }, { id: 2, title: 'sun' } ],
		} );

		expect( state ).toEqual( {
			1: { id: 1, title: 'beach' },
			2: { id: 2, title: 'sun' },
		} );
	} );
} );

describe( 'models', () => {
	it( 'returns the default state for all defined modedls', () => {
		const state = models( undefined, {} );

		expect( state.root.postType ).toEqual( { byPK: {} } );
	} );

	it( 'returns with received post types by slug', () => {
		const originalState = deepFreeze( {} );
		const state = models( originalState, {
			type: 'RECEIVE_MODEL_RECORDS',
			records: [ { slug: 'b', title: 'beach' }, { slug: 's', title: 'sun' } ],
			kind: 'root',
			name: 'postType',
		} );

		expect( state.root.postType ).toEqual( {
			byPK: {
				b: { slug: 'b', title: 'beach' },
				s: { slug: 's', title: 'sun' },
			},
		} );
	} );
} );
