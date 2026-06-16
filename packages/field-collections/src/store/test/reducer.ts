/**
 * Internal dependencies
 */
import reducer from '../reducer';
import { receiveEntityFieldCollections } from '../private-actions';
import type { FieldCollection } from '../types';

describe( 'field-collections reducer', () => {
	it( 'returns the default state', () => {
		expect( reducer( undefined, { type: 'UNKNOWN' } as any ) ).toEqual( {
			fieldCollections: {},
		} );
	} );

	it( 'stores collections keyed by `${kind}-${name}`', () => {
		const collections: FieldCollection< unknown >[] = [
			{
				id: 'core/post-fields',
				kind: 'postType',
				name: 'post',
				fields: [],
				fields_module: '@wordpress/field-collections/postType-post',
			},
		];

		const state = reducer(
			undefined,
			receiveEntityFieldCollections( 'postType', 'post', collections )
		);

		expect( state.fieldCollections ).toEqual( {
			'postType-post': collections,
		} );
	} );

	it( 'does not clobber collections for other entities', () => {
		const postCollections: FieldCollection< unknown >[] = [
			{ id: 'a', kind: 'postType', name: 'post', fields: [] },
		];
		const pageCollections: FieldCollection< unknown >[] = [
			{ id: 'b', kind: 'postType', name: 'page', fields: [] },
		];

		let state = reducer(
			undefined,
			receiveEntityFieldCollections( 'postType', 'post', postCollections )
		);
		state = reducer(
			state,
			receiveEntityFieldCollections( 'postType', 'page', pageCollections )
		);

		expect( state.fieldCollections ).toEqual( {
			'postType-post': postCollections,
			'postType-page': pageCollections,
		} );
	} );
} );
