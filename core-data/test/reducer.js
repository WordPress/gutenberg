/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { terms, entities } from '../reducer';
import { receiveTerms } from '../actions';

describe( 'terms()', () => {
	it( 'returns an empty object by default', () => {
		const state = terms( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'keys by taxonomy', () => {
		const originalState = deepFreeze( {} );
		const state = terms(
			originalState,
			receiveTerms( 'categories', undefined, [ { id: 1 } ] )
		);

		expect( state ).toHaveProperty( 'categories' );
	} );
} );

describe( 'entities', () => {
	it( 'returns the default state for all defined entities', () => {
		const state = entities( undefined, {} );

		expect( state.root.postType ).toEqual( { byKey: {} } );
	} );

	it( 'returns with received post types by slug', () => {
		const originalState = deepFreeze( {} );
		const state = entities( originalState, {
			type: 'RECEIVE_ENTITY_RECORDS',
			records: [ { slug: 'b', title: 'beach' }, { slug: 's', title: 'sun' } ],
			kind: 'root',
			name: 'postType',
		} );

		expect( state.root.postType ).toEqual( {
			byKey: {
				b: { slug: 'b', title: 'beach' },
				s: { slug: 's', title: 'sun' },
			},
		} );
	} );
} );
