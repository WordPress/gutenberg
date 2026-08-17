import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { initializeEditor } from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

// The parent playlist renders a third-party waveform widget that drives
// canvas, media element and Web Audio APIs JSDOM does not implement. Nothing
// here asserts on it.
vi.mock( '../../utils/waveform-player', () => ( {
	WaveformPlayer: () => <div />,
} ) );

const MEDIA_UPLOAD_FILTER = 'core/playlist-track/test/media-upload';
const REGISTRY_FILTER = 'core/playlist-track/test/registry';

// The handler only forwards the message to a notice, so its text is
// irrelevant to what these tests check.
const UPLOAD_ERROR = 'Upload failed.';

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

const secondTrackAttributes = {
	...defaultAttributes,
	id: 2,
	src: 'https://example.com/song-two.mp3',
	title: 'Song Two',
};

// What the stubbed Media Library hands back when a test opens it.
let mediaUploadSelection;

// `BlockEditorProvider` runs on a sub-registry, so the blocks under test are
// not in the default one. Grab the editor's own registry from inside it.
let editorRegistry;

function addRegistryCapture() {
	addFilter(
		'editor.BlockEdit',
		REGISTRY_FILTER,
		( BlockEdit ) =>
			function CaptureRegistry( props ) {
				editorRegistry = useRegistry();
				return <BlockEdit { ...props } />;
			}
	);
}

function addMediaUpload() {
	addFilter( 'editor.MediaUpload', MEDIA_UPLOAD_FILTER, () => {
		return ( { onSelect, render } ) =>
			render( {
				open: () => onSelect( mediaUploadSelection ),
			} );
	} );
}

/**
 * Renders a playlist holding the given tracks, which is how a playlist track
 * block is always used: it reads the playlist's context and reports the track
 * it is playing back to it.
 *
 * @param {Array}  tracks   Attributes for each `core/playlist-track` block.
 * @param {Object} settings Additional block editor settings.
 */
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

function getTrackClientIds() {
	const [ playlist ] = editorRegistry.select( blockEditorStore ).getBlocks();
	return playlist.innerBlocks.map( ( block ) => block.clientId );
}

function getTrackAttributes( index = 0 ) {
	const [ playlist ] = editorRegistry.select( blockEditorStore ).getBlocks();
	return playlist.innerBlocks[ index ].attributes;
}

async function selectTrack( index = 0 ) {
	const clientId = getTrackClientIds()[ index ];
	await act( async () => {
		editorRegistry.dispatch( blockEditorStore ).selectBlock( clientId );
	} );
}

async function multiSelectTracks() {
	const clientIds = getTrackClientIds();
	await act( async () => {
		editorRegistry
			.dispatch( blockEditorStore )
			.multiSelect( clientIds[ 0 ], clientIds[ clientIds.length - 1 ] );
	} );
}

async function openReplaceMediaLibrary() {
	await userEvent.click(
		screen.getByRole( 'button', { expanded: false, name: 'Replace' } )
	);
	await userEvent.click(
		screen.getByRole( 'menuitem', { name: 'Open Media Library' } )
	);
}

describe( 'PlaylistTrackEdit', () => {
	beforeEach( () => {
		// JSDOM's `createObjectURL` only accepts its own `File`, which is not
		// the `File` global this test file sees. `restoreMocks` puts these
		// back after every test, so they are stubbed per test.
		let blobCount = 0;
		vi.spyOn( window.URL, 'createObjectURL' ).mockImplementation(
			() => `blob:https://example.com/track-${ ++blobCount }`
		);
		vi.spyOn( window.URL, 'revokeObjectURL' ).mockImplementation(
			() => {}
		);

		mediaUploadSelection = undefined;
		editorRegistry = undefined;
		registerCoreBlocks();
		addMediaUpload();
		addRegistryCapture();
	} );

	afterEach( () => {
		removeFilter( 'editor.MediaUpload', MEDIA_UPLOAD_FILTER );
		removeFilter( 'editor.BlockEdit', REGISTRY_FILTER );
	} );

	it( 'shows the title control for a single selected playlist track', async () => {
		await setup( [ defaultAttributes ] );

		await selectTrack();

		expect(
			screen.getByRole( 'textbox', { name: 'Title' } )
		).toBeInTheDocument();
	} );

	it( 'shows the replace track control for a single selected playlist track', async () => {
		await setup( [ defaultAttributes ] );

		await selectTrack();

		expect(
			screen.getByRole( 'button', { expanded: false, name: 'Replace' } )
		).toBeInTheDocument();
	} );

	it( 'does not show the title or replace controls when multiple playlist tracks are selected', async () => {
		await setup( [ defaultAttributes, secondTrackAttributes ] );

		await multiSelectTracks();

		// The track inspector still renders for the first block of a same-type
		// multi-selection, but without the controls that only make sense for a
		// single track.
		expect(
			screen.queryByRole( 'textbox', { name: 'Title' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { expanded: false, name: 'Replace' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'textbox', { name: 'Artist' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'textbox', { name: 'Album' } )
		).toBeInTheDocument();
	} );

	it( 'allows the track image alternative text to be edited', async () => {
		await setup( [ defaultAttributes ] );

		await selectTrack();

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

		await selectTrack();

		expect(
			screen.queryByLabelText( 'Alternative text' )
		).not.toBeInTheDocument();
	} );

	it( 'sets the selected track as the current track', async () => {
		await setup( [ defaultAttributes, secondTrackAttributes ] );

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: /Song One/ } )
			).toHaveAttribute( 'aria-current', 'true' )
		);

		await selectTrack( 1 );

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: /Song Two/ } )
			).toHaveAttribute( 'aria-current', 'true' )
		);
	} );

	it( 'does not set a selected placeholder track as the current track', async () => {
		await setup( [ defaultAttributes, { title: 'Placeholder track' } ] );

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: /Song One/ } )
			).toHaveAttribute( 'aria-current', 'true' )
		);

		await selectTrack( 1 );

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

	it( 'removes the track when its initial upload fails', async () => {
		const file = new File( [ 'audio' ], 'temporary-track.mp3', {
			type: 'audio/mpeg',
		} );
		const blob = createBlobURL( file );

		await setup(
			[ defaultAttributes, { blob, title: 'Temporary track' } ],
			{
				mediaUpload: ( { onError } ) => onError( UPLOAD_ERROR ),
			}
		);

		// The playlist owns its inner blocks: removing the track with
		// `removeBlock` would take an unmodified playlist with it.
		await waitFor( () => expect( getTrackClientIds() ).toHaveLength( 1 ) );
		expect(
			screen.queryByRole( 'button', { name: /Temporary track/ } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: /Song One/ } )
		).toBeInTheDocument();
	} );

	// `onUploadError` also fires when replacing an existing track's media, so
	// removing the block unconditionally would discard the original track.
	it( 'keeps a track that already has a source when an upload fails', async () => {
		await setup( [ defaultAttributes ], {
			mediaUpload: ( { onError } ) => onError( UPLOAD_ERROR ),
		} );

		await selectTrack();
		await userEvent.click(
			screen.getByRole( 'button', { expanded: false, name: 'Replace' } )
		);
		// `FormFileUpload`'s input is hidden, so it has no accessible role.
		// eslint-disable-next-line testing-library/no-node-access
		const fileInput = document.querySelector( 'input[type="file"]' );
		await userEvent.upload(
			fileInput,
			new File( [ 'audio' ], 'replacement.mp3', { type: 'audio/mpeg' } )
		);

		// The original track is left untouched, so its source still plays.
		expect( getTrackClientIds() ).toHaveLength( 1 );
		expect(
			screen.getByRole( 'button', { name: /Song One/ } )
		).toBeInTheDocument();
	} );

	it( 'preserves the current track source when a replacement upload fails', async () => {
		// An empty selection is what `MediaReplaceFlow` reports back when a
		// replacement upload fails.
		mediaUploadSelection = {};
		await setup( [ defaultAttributes ] );

		await selectTrack();
		await openReplaceMediaLibrary();

		// The rest of the track's metadata is cleared, but its source is kept
		// so the track still plays.
		await waitFor( () =>
			expect( getTrackAttributes( 0 ) ).toEqual(
				expect.objectContaining( {
					src: 'https://example.com/song.mp3',
					title: undefined,
				} )
			)
		);
	} );

	it( 'accepts raw uploaded attachment data when replacing a track', async () => {
		mediaUploadSelection = {
			id: 2,
			source_url: 'https://example.com/replacement.mp3',
			title: { raw: 'Replacement &amp; Track' },
		};
		await setup( [ defaultAttributes ] );

		await selectTrack();
		await openReplaceMediaLibrary();

		expect(
			await screen.findByRole( 'button', { name: /Replacement & Track/ } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'textbox', { name: 'Title' } ) ).toHaveValue(
			'Replacement & Track'
		);
		expect(
			screen.queryByRole( 'button', { name: /Song One/ } )
		).not.toBeInTheDocument();
	} );
} );
