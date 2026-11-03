import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { store as coreDataStore } from '@wordpress/core-data';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { MediaUploadModal } from '../index';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

// Only HTTP is replaced: the modal, core-data hook, store and resolvers run normally.
vi.mock( import( '@wordpress/api-fetch' ) );

const apiFetchMock = vi.mocked( apiFetch );
const preferenceKey = 'dataviews-postType-attachment-media-modal';
const records = [
	{
		id: 1,
		title: { raw: 'Cat', rendered: 'Cat' },
		media_type: 'image',
		mime_type: 'image/png',
		source_url: 'https://example.com/cat.png',
		alt_text: '',
	},
	{
		id: 2,
		title: { raw: 'Dog', rendered: 'Dog' },
		media_type: 'image',
		mime_type: 'image/png',
		source_url: 'https://example.com/dog.png',
		alt_text: '',
	},
];

interface MediaRequest {
	page: number;
	complete: (
		items: typeof records,
		totalItems: number,
		totalPages: number
	) => void;
}

describe( 'MediaUploadModal loading', () => {
	let requests: MediaRequest[];

	beforeEach( () => {
		requests = [];
		apiFetchMock.mockImplementation( async ( { path, parse } ) => {
			const url = new URL( path!, 'https://example.com' );
			if ( url.pathname === '/wp/v2/types' ) {
				return {
					attachment: {
						name: 'Media',
						slug: 'attachment',
						rest_base: 'media',
						rest_namespace: 'wp/v2',
						supports: {},
					},
				};
			}
			if ( url.pathname === '/wp/v2/media' ) {
				if ( parse !== false ) {
					throw new Error( 'Expected an unparsed media response' );
				}
				return new Promise< Response >( ( resolve ) => {
					requests.push( {
						page: Number( url.searchParams.get( 'page' ) ),
						complete: ( items, totalItems, totalPages ) => {
							resolve(
								new Response( JSON.stringify( items ), {
									headers: {
										'X-WP-Total': String( totalItems ),
										'X-WP-TotalPages': String( totalPages ),
									},
								} )
							);
						},
					} );
				} );
			}
			throw new Error( `Unexpected request: ${ path }` );
		} );
	} );

	afterEach( async () => {
		await act( async () => {
			requests.forEach( ( request ) => request.complete( [], 0, 0 ) );
		} );
		vi.clearAllMocks();
		// Match the modal's existing tests: its fallback portal lives outside the render tree.
		/* eslint-disable testing-library/no-node-access */
		document
			.querySelectorAll( '.components-popover__fallback-container' )
			.forEach( ( node ) => node.remove() );
		/* eslint-enable testing-library/no-node-access */
	} );

	function renderModal() {
		const registry = createRegistry();
		registry.register( coreDataStore );
		registry.register( noticesStore );
		registry.register( preferencesStore );
		registry
			.dispatch( preferencesStore )
			.set( 'core/views', preferenceKey, { perPage: 2 } );
		render(
			<RegistryProvider value={ registry }>
				<MediaUploadModal
					isOpen
					value={ [] }
					onSelect={ vi.fn() }
					onClose={ vi.fn() }
				/>
			</RegistryProvider>
		);
	}

	it( 'keeps the dialog usable while media loads and shows the resolved results and totals', async () => {
		renderModal();
		await waitFor( () => expect( requests ).toHaveLength( 1 ) );
		const dialog = screen.getByRole( 'dialog', { name: 'Select Media' } );
		expect( within( dialog ).queryAllByRole( 'option' ) ).toHaveLength( 0 );
		expect(
			within( dialog ).getByRole( 'button', {
				name: 'Select',
			} )
		).toHaveAttribute( 'aria-disabled', 'true' );

		await act( async () => requests[ 0 ].complete( records, 3, 2 ) );
		expect( await within( dialog ).findAllByRole( 'option' ) ).toHaveLength(
			2
		);
		expect( within( dialog ).getByText( '2 of 3 items' ) ).toBeVisible();
		expect(
			within( dialog ).getByRole( 'button', { name: 'Next page' } )
		).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'shows an empty library when the initially pending request returns no media', async () => {
		renderModal();
		await waitFor( () => expect( requests ).toHaveLength( 1 ) );
		await act( async () => requests[ 0 ].complete( [], 0, 0 ) );
		const dialog = screen.getByRole( 'dialog', { name: 'Select Media' } );
		expect(
			await within( dialog ).findByText( 'No results' )
		).toBeVisible();
		expect( within( dialog ).getByText( '0 items' ) ).toBeVisible();
		expect(
			within( dialog ).queryByRole( 'button', { name: 'Next page' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps page two while its request is pending and shows the resolved results', async () => {
		const user = userEvent.setup();
		renderModal();
		await waitFor( () => expect( requests ).toHaveLength( 1 ) );
		await act( async () => requests[ 0 ].complete( records, 3, 2 ) );
		const dialog = screen.getByRole( 'dialog', { name: 'Select Media' } );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Next page' } )
		);
		await waitFor( () => expect( requests ).toHaveLength( 2 ) );
		expect( requests.map( ( request ) => request.page ) ).toEqual( [
			1, 2,
		] );
		expect( dialog ).toBeVisible();
		await act( async () =>
			requests[ 1 ].complete( [ records[ 1 ] ], 3, 2 )
		);
		expect(
			await within( dialog ).findByText( '1 of 3 items' )
		).toBeVisible();
		expect(
			within( dialog ).getByRole( 'button', { name: 'Previous page' } )
		).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			within( dialog ).getByRole( 'button', { name: 'Next page' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect( requests.map( ( request ) => request.page ) ).toEqual( [
			1, 2,
		] );
	} );
} );
