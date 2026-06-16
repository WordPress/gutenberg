/**
 * External dependencies
 */
import { renderHook, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useFieldCollections } from '../use-field-collections';
import type { FieldCollection } from '../../store/types';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

// Avoid registering the real store (which pulls in @wordpress/data internals).
jest.mock( '../../store', () => ( {
	store: 'core/field-collections',
} ) );

// Virtual script modules standing in for a collection's `fields_module`.
jest.mock(
	'@test/extensions-title',
	() => ( {
		__esModule: true,
		default: [ { id: 'title', render: () => 'rendered-title' } ],
	} ),
	{ virtual: true }
);

const mockUseSelect = useSelect as unknown as jest.Mock;

function setCollections( collections: FieldCollection< unknown >[] ) {
	mockUseSelect.mockReturnValue( collections );
}

describe( 'useFieldCollections', () => {
	beforeEach( () => {
		mockUseSelect.mockReset();
	} );

	it( 'returns an empty array when there are no collections', () => {
		setCollections( [] );
		const { result } = renderHook( () =>
			useFieldCollections( 'postType', 'post' )
		);
		expect( result.current ).toEqual( [] );
	} );

	it( 'merges the loaded extension onto the serializable field by id', async () => {
		setCollections( [
			{
				id: 'core/post-fields',
				kind: 'postType',
				name: 'post',
				fields: [
					{ id: 'title', label: 'Title', type: 'text' } as any,
					{ id: 'slug', label: 'Slug', type: 'text' } as any,
				],
				fields_module: '@test/extensions-title',
			},
		] );

		const { result } = renderHook( () =>
			useFieldCollections( 'postType', 'post' )
		);

		await waitFor( () => expect( result.current ).toHaveLength( 2 ) );

		const title = result.current.find( ( f ) => f.id === 'title' );
		const slug = result.current.find( ( f ) => f.id === 'slug' );
		// The extension's `render` was merged in.
		expect( title?.label ).toBe( 'Title' );
		expect( typeof title?.render ).toBe( 'function' );
		// A field with no matching extension is returned untouched.
		expect( slug?.render ).toBeUndefined();
	} );

	it( 'treats a collection without a fields_module as having no extensions', async () => {
		setCollections( [
			{
				id: 'core/no-module',
				kind: 'postType',
				name: 'post',
				fields: [
					{ id: 'title', label: 'Title', type: 'text' } as any,
				],
				fields_module: null,
			},
		] );

		const { result } = renderHook( () =>
			useFieldCollections( 'postType', 'post' )
		);

		await waitFor( () => expect( result.current ).toHaveLength( 1 ) );
		expect( result.current[ 0 ].render ).toBeUndefined();
	} );

	it( 'filters to allowedFields when provided', async () => {
		setCollections( [
			{
				id: 'core/post-fields',
				kind: 'postType',
				name: 'post',
				fields: [
					{ id: 'title', label: 'Title', type: 'text' } as any,
					{ id: 'slug', label: 'Slug', type: 'text' } as any,
				],
				fields_module: '@test/extensions-title',
			},
		] );

		const { result } = renderHook( () =>
			useFieldCollections( 'postType', 'post', {
				allowedFields: [ 'title' ],
			} )
		);

		await waitFor( () => expect( result.current ).toHaveLength( 1 ) );
		expect( result.current[ 0 ].id ).toBe( 'title' );
	} );

	it( 'falls back to the serializable fields when the module fails to load', async () => {
		const warn = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		setCollections( [
			{
				id: 'core/broken',
				kind: 'postType',
				name: 'post',
				fields: [
					{ id: 'title', label: 'Title', type: 'text' } as any,
				],
				fields_module: '@test/missing-module',
			},
		] );

		const { result } = renderHook( () =>
			useFieldCollections( 'postType', 'post' )
		);

		await waitFor( () => expect( result.current ).toHaveLength( 1 ) );
		expect( result.current[ 0 ].render ).toBeUndefined();
		expect( warn ).toHaveBeenCalled();

		warn.mockRestore();
	} );
} );
