import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { cleanup, render } from 'vitest-browser-react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/components/src/style.scss';
import MediaEditor, { type MediaEditorFrameProps } from '../index';
import type { Media } from '../../media-editor-provider';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../../../style.scss';

const attachment: Media = {
	id: 10,
	source_url:
		'data:image/svg+xml,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="black"/></svg>'
		),
	mime_type: 'image/svg+xml',
	media_details: { width: 600, height: 400 },
	alt_text: 'Saved alternative text',
};

function Frame( { children }: MediaEditorFrameProps ) {
	return (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				width: 900,
				height: 650,
			} }
		>
			{ children }
			<MediaEditor.SaveActions />
		</div>
	);
}

async function setup() {
	await page.viewport( 1000, 800 );
	const writes = vi.fn();
	vi.spyOn( window, 'fetch' ).mockImplementation(
		async ( input, options ) => {
			if ( options?.method === 'POST' ) {
				const url = new URL( String( input ), window.location.href );
				const data = JSON.parse( String( options.body ) );
				const response = writes( url.pathname, data );
				if ( response ) {
					return response;
				}
				return Response.json( { ...attachment, ...data } );
			}
			return Response.json( attachment );
		}
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
		.receiveEntityRecords( 'postType', 'attachment', [ attachment ] );
	const onSaved = vi.fn();
	await render(
		<RegistryProvider value={ registry }>
			<MediaEditor
				id={ 10 }
				onSaved={ onSaved }
				renderFrame={ Frame }
				fields={ [
					{
						id: 'alt_text',
						label: 'Alternative text',
						type: 'text',
					},
				] }
			/>
		</RegistryProvider>
	);
	await userEvent.click( screen.getByRole( 'tab', { name: 'Details' } ) );
	return { writes, onSaved };
}

afterEach( async () => {
	await cleanup();
	vi.restoreAllMocks();
} );

describe( 'Saving', () => {
	it( 'keeps the editor open with an error when saving details fails', async () => {
		const { writes, onSaved } = await setup();
		const alt = screen.getByRole( 'textbox', { name: 'Alternative text' } );
		await userEvent.fill( alt, 'Unsaved alternative text' );
		writes.mockReturnValueOnce(
			Response.json(
				{
					code: 'save_failed',
					message: 'Details could not be saved.',
					data: { status: 500 },
				},
				{ status: 500 }
			)
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		const notice = page.getByRole( 'button', {
			name: 'Dismiss this notice',
		} );
		await expect
			.element( notice )
			.toHaveTextContent(
				'Could not save image. Details could not be saved.'
			);
		expect( onSaved ).not.toHaveBeenCalled();
		expect( alt ).toHaveValue( 'Unsaved alternative text' );
	} );
} );
