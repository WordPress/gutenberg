import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

const MEDIA_UPLOAD_FILTER = 'core/playlist-track/test/media-upload';

const defaultAttributes = {
	id: 1,
	src: 'https://example.com/song.mp3',
	album: 'Great Album',
	artist: 'The Artist',
	image: 'https://example.com/cover.jpg',
	imageAlt: 'A bright abstract track image',
	length: '3:45',
	title: 'Song One',
};

let mediaUploadSelection;

function addMediaUpload() {
	addFilter( 'editor.MediaUpload', MEDIA_UPLOAD_FILTER, () => {
		return ( { onSelect, render } ) =>
			render( {
				open: () => onSelect( mediaUploadSelection ),
			} );
	} );
}

async function setup( tracks, settings = { mediaUpload: () => {} } ) {
	return initializeEditor(
		createBlock(
			'core/playlist',
			{},
			tracks.map( ( attributes ) =>
				createBlock( 'core/playlist-track', attributes )
			)
		),
		false,
		settings
	);
}

describe( 'PlaylistTrackEdit', () => {
	let jsdomStubs;

	beforeAll( () => {
		// The real playlist editor renders WaveformPlayer, which uses canvas
		// and media element APIs that JSDOM does not implement.
		jsdomStubs = [
			jest
				.spyOn( window.HTMLCanvasElement.prototype, 'getContext' )
				.mockReturnValue( null ),
			jest
				.spyOn( window.HTMLMediaElement.prototype, 'pause' )
				.mockImplementation( () => {} ),
			jest
				.spyOn( window.HTMLMediaElement.prototype, 'load' )
				.mockImplementation( () => {} ),
		];

		if ( ! window.URL.createObjectURL ) {
			window.URL.createObjectURL = jest.fn(
				() => 'blob:https://example.com/temporary-track'
			);
		}
		if ( ! window.URL.revokeObjectURL ) {
			window.URL.revokeObjectURL = jest.fn();
		}
	} );

	afterAll( () => {
		jsdomStubs.forEach( ( stub ) => stub.mockRestore() );
	} );

	beforeEach( () => {
		mediaUploadSelection = undefined;
		registerCoreBlocks();
		addMediaUpload();
	} );

	afterEach( () => {
		removeFilter( 'editor.MediaUpload', MEDIA_UPLOAD_FILTER );
	} );

	it( 'allows the track image alternative text to be edited', async () => {
		await setup( [ defaultAttributes ] );

		await selectBlock( 'Block: Playlist track' );

		expect(
			screen.getByRole( 'link', {
				name: /Describe the purpose of the image\./,
			} )
		).toHaveAttribute(
			'href',
			'https://www.w3.org/WAI/tutorials/images/decision-tree/'
		);
		expect(
			screen.queryByText( 'Leave empty if decorative.' )
		).not.toBeInTheDocument();

		await userEvent.clear( screen.getByLabelText( 'Alternative text' ) );
		await userEvent.type(
			screen.getByLabelText( 'Alternative text' ),
			'A silver microphone on a red background'
		);

		expect( screen.getByLabelText( 'Alternative text' ) ).toHaveValue(
			'A silver microphone on a red background'
		);
	} );

	it( 'does not show the alternative text control without a track image', async () => {
		await setup( [
			{
				...defaultAttributes,
				image: undefined,
				imageAlt: undefined,
			},
		] );

		await selectBlock( 'Block: Playlist track' );

		expect(
			screen.queryByLabelText( 'Alternative text' )
		).not.toBeInTheDocument();
	} );

	it( 'sets the selected track as the current track', async () => {
		await setup( [
			{
				...defaultAttributes,
				id: 1,
				title: 'Song One',
			},
			{
				...defaultAttributes,
				id: 2,
				src: 'https://example.com/song-two.mp3',
				title: 'Song Two',
			},
		] );

		await userEvent.click( screen.getByLabelText( 'Block: Playlist' ) );
		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: /Song One/ } )
			).toHaveAttribute( 'aria-current', 'true' )
		);

		await userEvent.click(
			screen.getAllByLabelText( 'Block: Playlist track' )[ 1 ]
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: /Song Two/ } )
			).toHaveAttribute( 'aria-current', 'true' )
		);
	} );

	it( 'does not set a selected placeholder track as the current track', async () => {
		await setup( [
			defaultAttributes,
			{
				title: 'Placeholder track',
			},
		] );

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: /Song One/ } )
			).toHaveAttribute( 'aria-current', 'true' )
		);

		await userEvent.click(
			screen.getAllByLabelText( 'Block: Playlist track' )[ 1 ]
		);

		expect(
			screen.getByRole( 'button', { name: /Song One/ } )
		).toHaveAttribute( 'aria-current', 'true' );
	} );

	it( 'uploads temporary blob tracks', async () => {
		let upload;
		const file = new File( [ 'audio' ], 'temporary-track.mp3', {
			type: 'audio/mpeg',
		} );
		const blob = createBlobURL( file );

		await setup(
			[
				{
					...defaultAttributes,
					blob,
					length: undefined,
					src: undefined,
				},
			],
			{
				mediaUpload: ( args ) => {
					upload = args;
				},
			}
		);

		await waitFor( () => expect( upload ).toBeDefined() );
		expect( upload ).toEqual(
			expect.objectContaining( {
				filesList: [ file ],
				allowedTypes: [ 'audio' ],
			} )
		);
		const trackButton = screen.getByRole( 'button', {
			name: /Song One/,
		} );

		expect(
			within( trackButton ).getByRole( 'presentation', { hidden: true } )
		).toBeInTheDocument();
	} );

	it( 'preserves the current track source when a replacement upload fails', async () => {
		mediaUploadSelection = {};
		const { container } = await setup( [ defaultAttributes ] );

		await selectBlock( 'Block: Playlist track' );
		await userEvent.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);
		await userEvent.click(
			screen.getByRole( 'menuitem', {
				name: 'Open Media Library',
			} )
		);
		await userEvent.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);

		/* eslint-disable testing-library/no-node-access */
		await waitFor( () => {
			expect(
				container.querySelector(
					'[data-url="https://example.com/song.mp3"]'
				)
			).toBeInTheDocument();
		} );
		/* eslint-enable testing-library/no-node-access */
	} );

	it( 'accepts raw uploaded attachment data when replacing a track', async () => {
		mediaUploadSelection = {
			id: 2,
			source_url: 'https://example.com/replacement.mp3',
			title: { raw: 'Replacement &amp; Track' },
		};
		await setup( [ defaultAttributes ] );

		await selectBlock( 'Block: Playlist track' );
		await userEvent.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);
		await userEvent.click(
			screen.getByRole( 'menuitem', {
				name: 'Open Media Library',
			} )
		);

		expect(
			await screen.findByRole( 'button', {
				name: /Replacement & Track/,
			} )
		).toBeInTheDocument();
		expect( screen.getByLabelText( 'Title' ) ).toHaveValue(
			'Replacement & Track'
		);
		expect(
			screen.queryByRole( 'button', {
				name: /Song One/,
			} )
		).not.toBeInTheDocument();
	} );
} );
