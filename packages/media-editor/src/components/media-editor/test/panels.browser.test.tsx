import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { cleanup, render } from 'vitest-browser-react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { registerPlugin, unregisterPlugin } from '@wordpress/plugins';
import '@wordpress/components/src/style.scss';
import MediaEditor, { type MediaEditorFrameProps } from '../index';
import MediaEditorPanel, {
	MEDIA_EDITOR_PLUGIN_SCOPE,
} from '../../media-editor-panel';
import { useMediaEditor } from '../../../state';
import type { Media } from '../../media-editor-provider';
import '../../../style.scss';

const report: Media = {
	id: 21,
	source_url: 'https://example.test/wp-content/uploads/report.pdf',
	mime_type: 'application/pdf',
	title: { raw: 'Report', rendered: 'Report' },
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
		</div>
	);
}

async function setup() {
	await page.viewport( 1000, 800 );
	vi.spyOn( window, 'fetch' ).mockImplementation( async () =>
		Response.json( report )
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
		.receiveEntityRecords( 'postType', 'attachment', [ report ] );
	await render(
		<RegistryProvider value={ registry }>
			<MediaEditor id={ 21 } renderFrame={ Frame } />
		</RegistryProvider>
	);
}

afterEach( async () => {
	await cleanup();
	vi.restoreAllMocks();
} );

describe( 'Media editor panels', () => {
	it( 'shows a non-image attachment only the panels for its media type', async () => {
		await setup();

		expect(
			await screen.findByRole( 'tab', { name: 'Details' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'tab', { name: 'Crop' } )
		).not.toBeInTheDocument();
	} );

	it( 'mounts a plugin panel registered in the media editor scope, with the session', async () => {
		function EditCount() {
			const { edits } = useMediaEditor();
			return <p>Edits: { Object.keys( edits ).length }</p>;
		}
		registerPlugin( 'test-media-panels', {
			scope: MEDIA_EDITOR_PLUGIN_SCOPE,
			render: () => (
				<>
					<MediaEditorPanel
						name="test/document"
						title="Document"
						mediaTypes={ [ 'application' ] }
					>
						<EditCount />
					</MediaEditorPanel>
					<MediaEditorPanel
						name="test/image-only"
						title="Image only"
						mediaTypes={ [ 'image' ] }
					>
						Never shown for a document
					</MediaEditorPanel>
				</>
			),
		} );
		try {
			await setup();

			const tab = await screen.findByRole( 'tab', { name: 'Document' } );
			expect(
				screen.queryByRole( 'tab', { name: 'Image only' } )
			).not.toBeInTheDocument();
			await userEvent.click( tab );
			expect( await screen.findByText( 'Edits: 0' ) ).toBeInTheDocument();
		} finally {
			unregisterPlugin( 'test-media-panels' );
		}
	} );
} );
