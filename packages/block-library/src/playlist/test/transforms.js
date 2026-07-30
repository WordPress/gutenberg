/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
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
				} ),
			} ),
		] );
	} );
} );
