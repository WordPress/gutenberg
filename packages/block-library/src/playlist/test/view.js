let mockContext;
let mockElement;
let mockRegisteredStore;
let mockPlayer;

jest.mock( '@wordpress/interactivity', () => ( {
	store: ( name, config ) => {
		mockRegisteredStore = config;
		return config;
	},
	getContext: () => mockContext,
	getElement: () => mockElement,
} ) );

jest.mock( '../../utils/waveform-utils', () => ( {
	initWaveformPlayer: jest.fn( () => mockPlayer ),
	logPlayError: jest.fn(),
	setupPlayButtonArtwork: jest.fn(),
	updateSeekControlLabel: jest.fn(),
} ) );

jest.mock( '../../utils/media-playback', () => ( {
	notifyMediaPlayback: jest.fn(),
	registerPlaylistPlayer: jest.fn( () => jest.fn() ),
} ) );

describe( 'Playlist view script', () => {
	beforeEach( async () => {
		jest.resetModules();

		mockContext = {
			currentId: 'track-1',
			isPlaying: false,
			playlistId: 'playlist-1',
			showPlayButtonArtwork: false,
			tracks: [ 'track-1' ],
		};
		mockElement = {
			ref: document.createElement( 'div' ),
		};
		mockPlayer = {
			instance: {
				destroy: jest.fn(),
				isPlaying: true,
				pause: jest.fn(),
			},
			container: document.createElement( 'div' ),
			destroy: jest.fn(),
		};
		mockRegisteredStore = null;

		await import( '../view' );
		mockRegisteredStore.state.playlists = {
			'playlist-1': {
				tracks: {
					'track-1': {
						url: 'https://example.com/song.mp3',
						title: 'Song title',
						artist: 'Artist',
					},
				},
			},
		};
	} );

	afterEach( () => {
		document.body.replaceChildren();
		jest.restoreAllMocks();
	} );

	it( 'notifies media playback when the current playlist starts playing', async () => {
		const { notifyMediaPlayback, registerPlaylistPlayer } = await import(
			'../../utils/media-playback'
		);

		mockRegisteredStore.callbacks.initWaveformPlayer();
		mockPlayer.container.dispatchEvent(
			new CustomEvent( 'waveformplayer:play' )
		);

		const registeredPlayer = registerPlaylistPlayer.mock.calls[ 0 ][ 0 ];

		expect( mockContext.isPlaying ).toBe( true );
		expect( notifyMediaPlayback ).toHaveBeenCalledWith( registeredPlayer );
	} );
} );
