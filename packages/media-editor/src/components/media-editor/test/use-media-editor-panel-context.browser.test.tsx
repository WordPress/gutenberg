import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { cleanup, render } from 'vitest-browser-react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import '@wordpress/components/src/style.scss';
import MediaEditor, {
	useMediaEditorPanelContext,
	type MediaEditorFrameProps,
} from '../index';
import { useMediaEditor } from '../../../state';
import type { Media } from '../../media-editor-provider';
import '../../../style.scss';

const image: Media = {
	id: 31,
	source_url:
		'data:image/svg+xml,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="black"/></svg>'
		),
	mime_type: 'image/svg+xml',
	media_details: { width: 600, height: 400 },
	title: { raw: 'Black', rendered: 'Black' },
};

/* A panel's view of the editor, beside what the session itself holds. */
function Probe() {
	const {
		mediaType,
		isSaving,
		aspectRatioValue,
		setAspectRatioValue,
		rotate,
		flipHorizontal,
	} = useMediaEditorPanelContext();
	const { state } = useMediaEditor().cropper;
	return (
		<div>
			<p>
				{ `type:${ mediaType } saving:${ isSaving } ratio:${ aspectRatioValue } rotation:${ Math.abs(
					state.rotation
				) } flipped:${ state.flip.horizontal }` }
			</p>
			<button onClick={ () => setAspectRatioValue( '1' ) }>Square</button>
			<button onClick={ () => rotate( 1 ) }>Rotate</button>
			<button onClick={ flipHorizontal }>Flip</button>
		</div>
	);
}

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
			<Probe />
			{ children }
		</div>
	);
}

async function setup() {
	await page.viewport( 1000, 800 );
	vi.spyOn( window, 'fetch' ).mockImplementation( async () =>
		Response.json( image )
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
		.receiveEntityRecords( 'postType', 'attachment', [ image ] );
	await render(
		<RegistryProvider value={ registry }>
			<MediaEditor id={ 31 } renderFrame={ Frame } />
		</RegistryProvider>
	);
}

afterEach( async () => {
	await cleanup();
	vi.restoreAllMocks();
} );

describe( 'useMediaEditorPanelContext', () => {
	it( 'reads the editor and drives the session', async () => {
		await setup();

		expect(
			await screen.findByText( /^type:image saving:false ratio:/ )
		).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Square' } )
		);
		expect( await screen.findByText( /ratio:1 / ) ).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Rotate' } )
		);
		expect( await screen.findByText( /rotation:90 / ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Flip' } ) );
		expect(
			await screen.findByText( /flipped:true$/ )
		).toBeInTheDocument();
	} );
} );
