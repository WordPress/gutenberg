import { notifyMediaPlayback, registerPlaylistPlayer } from '../media-playback';

function mockMediaPlaybackState( media, isPaused = false ) {
	let paused = isPaused;

	Object.defineProperty( media, 'paused', {
		configurable: true,
		get: () => paused,
	} );

	jest.spyOn( media, 'pause' ).mockImplementation( () => {
		paused = true;
	} );
}

describe( 'media playback coordination', () => {
	afterEach( () => {
		document.body.replaceChildren();
		jest.restoreAllMocks();
	} );

	it( 'stops other audio and video blocks when a native media block starts playing', () => {
		document.body.innerHTML = `
			<figure class="wp-block-audio"><audio></audio></figure>
			<figure class="wp-block-audio"><audio></audio></figure>
			<figure class="wp-block-video"><video controls></video></figure>
			<figure class="wp-block-video"><video></video></figure>
		`;
		const [ currentAudio, otherAudio ] =
			document.querySelectorAll( 'audio' );
		const [ otherVideo, videoWithoutControls ] =
			document.querySelectorAll( 'video' );

		[ currentAudio, otherAudio, otherVideo, videoWithoutControls ].forEach(
			( media ) => mockMediaPlaybackState( media )
		);

		currentAudio.dispatchEvent( new Event( 'play' ) );

		expect( currentAudio.pause ).not.toHaveBeenCalled();
		expect( otherAudio.pause ).toHaveBeenCalledTimes( 1 );
		expect( otherVideo.pause ).toHaveBeenCalledTimes( 1 );
		expect( videoWithoutControls.pause ).not.toHaveBeenCalled();
	} );

	it( 'stops audio and video blocks when a playlist starts playing', () => {
		document.body.innerHTML = `
			<figure class="wp-block-audio"><audio></audio></figure>
			<figure class="wp-block-video"><video controls></video></figure>
		`;
		const mediaElements = document.querySelectorAll( 'audio, video' );
		mediaElements.forEach( ( media ) => mockMediaPlaybackState( media ) );

		const playlistPlayer = {
			instance: {
				isPlaying: true,
				pause: jest.fn(),
			},
		};
		const unregister = registerPlaylistPlayer( playlistPlayer );

		notifyMediaPlayback( playlistPlayer );

		mediaElements.forEach( ( media ) => {
			expect( media.pause ).toHaveBeenCalledTimes( 1 );
		} );
		expect( playlistPlayer.instance.pause ).not.toHaveBeenCalled();

		unregister();
	} );

	it( 'stops playlist players when an audio or video block starts playing', () => {
		document.body.innerHTML =
			'<figure class="wp-block-video"><video controls></video></figure>';
		const video = document.querySelector( 'video' );
		mockMediaPlaybackState( video );

		const playlistPlayer = {
			instance: {
				isPlaying: true,
				pause: jest.fn(),
			},
		};
		const unregister = registerPlaylistPlayer( playlistPlayer );

		video.dispatchEvent( new Event( 'play' ) );

		expect( video.pause ).not.toHaveBeenCalled();
		expect( playlistPlayer.instance.pause ).toHaveBeenCalledTimes( 1 );

		unregister();
	} );

	it( 'stops other playlist players when a playlist starts playing', () => {
		const currentPlaylistPlayer = {
			instance: {
				isPlaying: true,
				pause: jest.fn(),
			},
		};
		const otherPlaylistPlayer = {
			instance: {
				isPlaying: true,
				pause: jest.fn(),
			},
		};
		const unregisterCurrent = registerPlaylistPlayer(
			currentPlaylistPlayer
		);
		const unregisterOther = registerPlaylistPlayer( otherPlaylistPlayer );

		notifyMediaPlayback( currentPlaylistPlayer );

		expect( currentPlaylistPlayer.instance.pause ).not.toHaveBeenCalled();
		expect( otherPlaylistPlayer.instance.pause ).toHaveBeenCalledTimes( 1 );

		unregisterCurrent();
		unregisterOther();
	} );
} );
