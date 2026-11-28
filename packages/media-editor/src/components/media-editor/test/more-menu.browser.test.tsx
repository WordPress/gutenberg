import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen, waitFor } from '@testing-library/react';
import { cleanup, render } from 'vitest-browser-react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import type { Action } from '@wordpress/dataviews';
import '@wordpress/components/src/style.scss';
// The package stylesheet loads the image editor's built CSS, which only
// exists after a build, so load the same styles from source.
import '@wordpress/image-editor/src/style.scss';
import MediaEditor, { type MediaEditorFrameProps } from '../index';
import type { Media } from '../../media-editor-provider';
import '../style.scss';

const image: Media = {
	id: 10,
	source_url:
		'data:image/svg+xml,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="black"/></svg>'
		),
	mime_type: 'image/svg+xml',
	media_details: { width: 600, height: 400 },
	title: { raw: 'An image', rendered: 'An image' },
};

const pdf: Media = {
	id: 20,
	source_url: 'data:application/pdf,',
	mime_type: 'application/pdf',
	title: { raw: 'A document', rendered: 'A document' },
};

async function setup( {
	media,
	actions,
}: {
	media: Media;
	actions: Action< Media >[];
} ) {
	await page.viewport( 1000, 800 );
	vi.spyOn( window, 'fetch' ).mockImplementation( async () =>
		Response.json( media )
	);
	const registry = createRegistry();
	registry.register( coreStore );
	registry.register( noticesStore );
	registry.dispatch( coreStore ).addEntities( [
		{
			kind: 'postType',
			name: 'attachment',
			baseURL: '/wp/v2/media',
			baseURLParams: { context: 'edit' },
			rawAttributes: [ 'title', 'caption', 'description' ],
		},
	] );
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'postType', 'attachment', [ media ] );

	function Frame( { children }: MediaEditorFrameProps ) {
		return (
			<div style={ { width: 900, height: 650 } }>
				<MediaEditor.MoreMenu actions={ actions } item={ media } />
				{ children }
			</div>
		);
	}

	await render(
		<RegistryProvider value={ registry }>
			<MediaEditor id={ media.id! } renderFrame={ Frame } />
		</RegistryProvider>
	);
	return { registry };
}

async function openMoreMenu() {
	await userEvent.click(
		await screen.findByRole( 'button', { name: 'More options' } )
	);
}

afterEach( async () => {
	await cleanup();
	vi.restoreAllMocks();
} );

describe( 'MoreMenu', () => {
	it( 'lists the eligible actions after the keyboard shortcuts', async () => {
		await setup( {
			media: image,
			actions: [
				{
					id: 'eligible',
					label: 'Eligible action',
					isEligible: () => true,
					callback: vi.fn(),
				},
				{
					id: 'ineligible',
					label: 'Ineligible action',
					isEligible: () => false,
					callback: vi.fn(),
				},
			],
		} );

		await openMoreMenu();

		const items = screen.getAllByRole( 'menuitem' );
		expect( items.map( ( item ) => item.textContent ) ).toEqual( [
			'Keyboard shortcuts',
			'Eligible action',
		] );
	} );

	it( 'calls a callback action with the item', async () => {
		const callback = vi.fn();
		await setup( {
			media: image,
			actions: [ { id: 'view', label: 'View', callback } ],
		} );

		await openMoreMenu();
		await userEvent.click(
			screen.getByRole( 'menuitem', { name: 'View' } )
		);

		expect( callback ).toHaveBeenCalledWith(
			[ image ],
			expect.objectContaining( { registry: expect.anything() } )
		);
	} );

	it( 'opens and closes the modal of a modal action', async () => {
		await setup( {
			media: image,
			actions: [
				{
					id: 'delete',
					label: 'Delete',
					// As the core delete actions do.
					hideModalHeader: true,
					RenderModal: ( { items, closeModal } ) => (
						<button onClick={ closeModal }>
							{ `Confirm ${ items[ 0 ].id }` }
						</button>
					),
				},
			],
		} );

		await openMoreMenu();
		await userEvent.click(
			screen.getByRole( 'menuitem', { name: 'Delete…' } )
		);
		const dialog = await screen.findByRole( 'dialog' );
		expect( dialog ).toBeVisible();
		expect(
			screen.queryByRole( 'heading', { name: 'Delete' } )
		).not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Confirm 10' } )
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);
	} );

	it( 'shows only the actions for media other than images', async () => {
		await setup( {
			media: pdf,
			actions: [ { id: 'view', label: 'View', callback: vi.fn() } ],
		} );

		await openMoreMenu();

		const items = screen.getAllByRole( 'menuitem' );
		expect( items.map( ( item ) => item.textContent ) ).toEqual( [
			'View',
		] );
	} );

	it( 'is hidden for media other than images with no eligible actions', async () => {
		await setup( {
			media: pdf,
			actions: [
				{
					id: 'ineligible',
					label: 'Ineligible action',
					isEligible: () => false,
					callback: vi.fn(),
				},
			],
		} );

		// Wait for the editor to render before checking for the menu.
		await screen.findByRole( 'region', { name: 'Media settings' } );
		expect(
			screen.queryByRole( 'button', { name: 'More options' } )
		).not.toBeInTheDocument();
	} );
} );
