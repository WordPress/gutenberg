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
	metadata as playlistTrackMetadata,
	settings as playlistTrackSettings,
} from '../index';
import audioMetadata from '../../audio/block.json';

describe( 'Playlist Track transforms', () => {
	beforeAll( () => {
		registerBlockType( playlistTrackMetadata, playlistTrackSettings );
		registerBlockType( audioMetadata, { edit: () => null } );
	} );

	afterAll( () => {
		unregisterBlockType( playlistTrackMetadata.name );
		unregisterBlockType( audioMetadata.name );
	} );

	it( 'converts a Playlist Track into Audio with its source data', () => {
		const playlistTrack = createBlock( 'core/playlist-track', {
			blob: 'blob:https://example.com/track',
			id: 123,
			src: 'https://example.com/track.mp3',
		} );

		const [ audio ] = switchToBlockType( playlistTrack, 'core/audio' );

		expect( audio ).toMatchObject( {
			name: 'core/audio',
			attributes: {
				blob: 'blob:https://example.com/track',
				id: 123,
				src: 'https://example.com/track.mp3',
			},
		} );
	} );
} );
