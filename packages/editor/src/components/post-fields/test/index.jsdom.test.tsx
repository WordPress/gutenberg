import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import usePostFields from '..';
import { store as editorStore } from '../../../store';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/api-fetch' ) );

/**
 * Leaves the requests other than the fields' pending, which these tests do
 * not need.
 *
 * @return A promise that never settles.
 */
function pending() {
	return new Promise( () => {} );
}

describe( 'usePostFields', () => {
	function renderUsePostFields( postType: string ) {
		const registry = createRegistry();
		registry.register( coreStore );
		registry.register( editorStore );
		registry.register( noticesStore );
		const { result } = renderHook( () => usePostFields( { postType } ), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>
					{ children }
				</RegistryProvider>
			),
		} );
		return { registry, result };
	}

	it( 'shows a snackbar when the fields cannot be requested', async () => {
		vi.mocked( apiFetch ).mockImplementation( ( options ) => {
			if ( options.path?.startsWith( '/wp/v2/entity-fields' ) ) {
				return Promise.reject( {
					code: 'rest_forbidden',
					message: 'Sorry, you are not allowed to do that.',
					data: { status: 403 },
				} );
			}
			return pending();
		} );

		const { registry, result } = renderUsePostFields( 'page' );

		await waitFor( () =>
			expect( registry.select( noticesStore ).getNotices() ).toEqual( [
				expect.objectContaining( {
					id: 'editor-post-fields-page',
					status: 'error',
					type: 'snackbar',
					content: 'Sorry, you are not allowed to do that.',
				} ),
			] )
		);
		expect( result.current ).toEqual( [] );
	} );

	it( 'shows no notice when the fields load', async () => {
		vi.mocked( apiFetch ).mockImplementation( ( options ) =>
			options.path?.startsWith( '/wp/v2/entity-fields' )
				? Promise.resolve( {
						kind: 'postType',
						name: 'page',
						fields: [ { id: 'title', type: 'text' } ],
						script_modules: [],
					} )
				: pending()
		);

		const { registry, result } = renderUsePostFields( 'page' );

		await waitFor( () => expect( result.current ).toHaveLength( 1 ) );
		expect( registry.select( noticesStore ).getNotices() ).toEqual( [] );
	} );
} );
