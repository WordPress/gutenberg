import {
	createBlock,
	getPossibleBlockTransformations,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import {
	metadata as playlistMetadata,
	settings as playlistSettings,
} from '../index';
import playlistTrackMetadata from '../../playlist-track/block.json';
import audioMetadata from '../../audio/block.json';

describe( 'Playlist transforms', () => {
	beforeAll( () => {
		registerBlockType( playlistMetadata, playlistSettings );
		registerBlockType( playlistTrackMetadata, { edit: () => null } );
		registerBlockType( audioMetadata, { edit: () => null } );
	} );

	afterAll( () => {
		unregisterBlockType( playlistMetadata.name );
		unregisterBlockType( playlistTrackMetadata.name );
		unregisterBlockType( audioMetadata.name );
	} );

	it( 'converts an Audio block into a Playlist with its audio as a track', () => {
		const audio = createBlock( 'core/audio', {
			blob: 'blob:https://example.com/track',
			caption: 'A playlist caption',
			id: 123,
			src: 'https://example.com/track.mp3',
		} );

		const [ playlist ] = switchToBlockType( audio, 'core/playlist' );

		expect( playlist ).toMatchObject( {
			name: 'core/playlist',
			attributes: {
				caption: 'A playlist caption',
			},
		} );
		expect( playlist.innerBlocks ).toEqual( [
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					blob: 'blob:https://example.com/track',
					id: 123,
					src: 'https://example.com/track.mp3',
					title: 'track.mp3',
				} ),
			} ),
		] );
	} );

	it( 'converts multiple selected Audio blocks into one Playlist', () => {
		const audioBlocks = [
			createBlock( 'core/audio', {
				blob: 'blob:https://example.com/first-track',
				id: 123,
				src: 'https://example.com/first-track.mp3',
			} ),
			createBlock( 'core/audio', {
				blob: 'blob:https://example.com/second-track',
				src: 'https://example.com/second-track.mp3',
			} ),
		];

		const [ playlist ] = switchToBlockType( audioBlocks, 'core/playlist' );

		expect( playlist.innerBlocks ).toEqual( [
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					blob: 'blob:https://example.com/first-track',
					id: 123,
					src: 'https://example.com/first-track.mp3',
					title: 'first-track.mp3',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					blob: 'blob:https://example.com/second-track',
					src: 'https://example.com/second-track.mp3',
					title: 'second-track.mp3',
				} ),
			} ),
		] );
	} );

	it( 'preserves shared layout attributes when converting Audio to Playlist', () => {
		const audio = createBlock( 'core/audio', {
			align: 'wide',
			anchor: 'my-audio',
			style: {
				spacing: {
					margin: { top: '1rem' },
					padding: { bottom: '2rem' },
				},
			},
		} );

		const [ playlist ] = switchToBlockType( audio, 'core/playlist' );

		expect( playlist.attributes ).toMatchObject( {
			align: 'wide',
			anchor: 'my-audio',
			style: {
				spacing: {
					margin: { top: '1rem' },
					padding: { bottom: '2rem' },
				},
			},
		} );
	} );

	it( 'converts Audio without an attachment ID', () => {
		const audio = createBlock( 'core/audio', {
			src: 'https://example.com/track.mp3',
		} );

		const [ playlist ] = switchToBlockType( audio, 'core/playlist' );

		expect( playlist.innerBlocks[ 0 ].attributes ).not.toHaveProperty(
			'id'
		);
	} );

	it( 'converts a one-track Playlist into Audio', () => {
		const playlist = createBlock(
			'core/playlist',
			{
				align: 'wide',
				anchor: 'my-playlist',
				caption: 'A playlist caption',
				style: { spacing: { margin: { top: '1rem' } } },
			},
			[
				createBlock( 'core/playlist-track', {
					blob: 'blob:https://example.com/track',
					id: 123,
					src: 'https://example.com/track.mp3',
				} ),
			]
		);

		expect( getPossibleBlockTransformations( [ playlist ] ) ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { name: 'core/audio' } ),
			] )
		);

		const [ audio ] = switchToBlockType( playlist, 'core/audio' );

		expect( audio ).toMatchObject( {
			name: 'core/audio',
			attributes: {
				align: 'wide',
				anchor: 'my-playlist',
				blob: 'blob:https://example.com/track',
				id: 123,
				src: 'https://example.com/track.mp3',
				style: { spacing: { margin: { top: '1rem' } } },
			},
		} );
		expect( audio.attributes.caption.toString() ).toBe(
			'A playlist caption'
		);
	} );

	it( 'converts a multi-track Playlist into multiple Audio blocks', () => {
		const playlist = createBlock(
			'core/playlist',
			{
				align: 'wide',
				anchor: 'my-playlist',
				caption: 'A playlist caption',
				style: { spacing: { margin: { top: '1rem' } } },
			},
			[
				createBlock( 'core/playlist-track', {
					blob: 'blob:https://example.com/first-track',
					id: 123,
					src: 'https://example.com/first-track.mp3',
				} ),
				createBlock( 'core/playlist-track', {
					id: 456,
					src: 'https://example.com/second-track.mp3',
				} ),
			]
		);

		expect( getPossibleBlockTransformations( [ playlist ] ) ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { name: 'core/audio' } ),
			] )
		);

		const audioBlocks = switchToBlockType( playlist, 'core/audio' );

		expect( audioBlocks ).toHaveLength( 2 );
		expect( audioBlocks[ 0 ] ).toMatchObject( {
			name: 'core/audio',
			attributes: {
				align: 'wide',
				blob: 'blob:https://example.com/first-track',
				id: 123,
				src: 'https://example.com/first-track.mp3',
				style: { spacing: { margin: { top: '1rem' } } },
			},
		} );
		expect( audioBlocks[ 0 ].attributes ).not.toHaveProperty( 'anchor' );
		expect( audioBlocks[ 0 ].attributes.caption.toString() ).toBe( '' );
		expect( audioBlocks[ 1 ] ).toMatchObject( {
			name: 'core/audio',
			attributes: {
				align: 'wide',
				id: 456,
				src: 'https://example.com/second-track.mp3',
				style: { spacing: { margin: { top: '1rem' } } },
			},
		} );
	} );

	it( 'does not offer Playlist to Audio without tracks', () => {
		const playlist = createBlock( 'core/playlist' );

		expect( getPossibleBlockTransformations( [ playlist ] ) ).not.toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { name: 'core/audio' } ),
			] )
		);
	} );
} );
