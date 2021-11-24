/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-hooks';

/**
 * Internal dependencies
 */
import useGetNewImages from '../use-get-new-images';

describe( 'gallery block useGetNewImages hook', () => {
	let hook;
	beforeEach( () => {
		hook = renderHook(
			( { images, imageData } ) => useGetNewImages( images, imageData ),
			{
				initialProps: { images: [ { test: 1 } ], imageData: [] },
			}
		);
	} );

	it( 'returns null if no images currently in the gallery', () => {
		expect( hook.result.current ).toEqual( null );
	} );

	it( 'returns an empty array if the only images are those those loaded from post content', () => {
		hook.rerender( {
			images: [ { clientId: 'abc123', id: 1, fromSavedContent: true } ],
			imageData: [ { id: 1 } ],
		} );

		expect( hook.result.current ).toEqual( null );
	} );

	it( 'returns array of new images that have been added since the last render', () => {
		hook.rerender( {
			images: [ { clientId: 'abc123', id: 1 } ],
			imageData: [ { id: 1 } ],
		} );

		expect( hook.result.current ).toEqual( [
			{ clientId: 'abc123', id: 1 },
		] );

		hook.rerender( {
			images: [
				{ clientId: 'abc123', id: 1 },
				{ clientId: 'efg456', id: 2 },
			],
			imageData: [ { id: 1 }, { id: 2 } ],
		} );

		expect( hook.result.current ).toEqual( [
			{ clientId: 'efg456', id: 2 },
		] );
	} );

	it( 'sees an image as new if it has been deleted and added again', () => {
		hook.rerender( {
			images: [
				{ clientId: 'abc123', id: 1 },
				{ clientId: 'efg456', id: 2 },
			],
			imageData: [ { id: 1 }, { id: 2 } ],
		} );

		expect( hook.result.current ).toEqual( [
			{ clientId: 'abc123', id: 1 },
			{ clientId: 'efg456', id: 2 },
		] );

		hook.rerender( {
			images: [ { clientId: 'abc123', id: 1 } ],
			imageData: [ { id: 1 } ],
		} );

		expect( hook.result.current ).toEqual( null );

		hook.rerender( {
			images: [
				{ clientId: 'abc123', id: 1 },
				{ clientId: 'efg456', id: 2 },
			],
			imageData: [ { id: 1 }, { id: 2 } ],
		} );

		expect( hook.result.current ).toEqual( [
			{ clientId: 'efg456', id: 2 },
		] );
	} );
} );
