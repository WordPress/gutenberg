/**
 * External dependencies
 */
import '@testing-library/jest-dom';

/**
 * Internal dependencies
 */
import {
	createWaveformContainer,
	styleSvgIcons,
	setupPlayButtonAccessibility,
	updateSeekControlLabel,
	logPlayError,
	getNextShuffledTrack,
	isShuffleCycleComplete,
	getNextRepeatMode,
	getPlaylistPlaybackAction,
	replayWaveformPlayerTrack,
	setupPlaylistControls,
} from '../waveform-utils';

// Base player data used across tests
const basePlayerData = {
	url: 'https://example.com/song.mp3',
	waveformColor: 'rgba(0, 0, 0, 0.3)',
	progressColor: 'rgba(0, 0, 0, 0.6)',
	buttonColor: '#000000',
};

describe( 'Waveform utilities', () => {
	describe( 'createWaveformContainer', () => {
		it( 'should create a container with required data attributes', () => {
			const container = createWaveformContainer( basePlayerData );

			expect( container.tagName ).toBe( 'DIV' );
			expect( container ).toHaveAttribute( 'data-waveform-player', '' );
			expect( container ).toHaveAttribute(
				'data-url',
				'https://example.com/song.mp3'
			);
			expect( container ).toHaveAttribute( 'data-height', '120' );
			expect( container ).toHaveAttribute(
				'data-waveform-style',
				'bars'
			);
			expect( container ).toHaveAttribute(
				'data-waveform-color',
				'rgba(0, 0, 0, 0.3)'
			);
			expect( container ).toHaveAttribute(
				'data-progress-color',
				'rgba(0, 0, 0, 0.6)'
			);
			expect( container ).toHaveAttribute(
				'data-button-color',
				'#000000'
			);
			expect( container ).toHaveAttribute( 'data-seek-label', 'Seek' );
		} );

		it( 'should set optional attributes when provided', () => {
			const container = createWaveformContainer( {
				...basePlayerData,
				title: 'My Song',
				artist: 'The Artist',
				artwork: 'https://example.com/cover.jpg',
				seekLabel: 'My Song',
			} );

			expect( container ).toHaveAttribute( 'data-title', 'My Song' );
			expect( container ).toHaveAttribute( 'data-artist', 'The Artist' );
			expect( container ).toHaveAttribute(
				'data-artwork',
				'https://example.com/cover.jpg'
			);
			expect( container ).toHaveAttribute( 'data-seek-label', 'My Song' );
		} );

		it( 'should set the seek value-text template when provided', () => {
			const container = createWaveformContainer( {
				...basePlayerData,
				seekValueText: '%1$s of %2$s',
			} );

			expect( container ).toHaveAttribute(
				'data-seek-value-text',
				'%1$s of %2$s'
			);
		} );

		it( 'should not set optional attributes when not provided', () => {
			const container = createWaveformContainer( basePlayerData );

			expect( container ).not.toHaveAttribute( 'data-title' );
			expect( container ).not.toHaveAttribute( 'data-artist' );
			expect( container ).not.toHaveAttribute( 'data-artwork' );
			expect( container ).not.toHaveAttribute( 'data-seek-value-text' );
		} );

		it( 'should use custom height when provided', () => {
			const container = createWaveformContainer( {
				...basePlayerData,
				height: 150,
			} );

			expect( container ).toHaveAttribute( 'data-height', '150' );
		} );
	} );

	describe( 'styleSvgIcons', () => {
		it( 'should set white fill for dark button colors', () => {
			const container = document.createElement( 'div' );
			const svg = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'svg'
			);
			const path = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			svg.appendChild( path );
			container.appendChild( svg );

			styleSvgIcons( container, '#000000' );

			expect( path ).toHaveStyle( { fill: '#ffffff' } );
		} );

		it( 'should set black fill for light button colors', () => {
			const container = document.createElement( 'div' );
			const svg = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'svg'
			);
			const path = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			svg.appendChild( path );
			container.appendChild( svg );

			styleSvgIcons( container, '#ffffff' );

			expect( path ).toHaveStyle( { fill: '#000000' } );
		} );

		it( 'should style multiple SVG paths', () => {
			const container = document.createElement( 'div' );
			const svg = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'svg'
			);
			const path1 = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			const path2 = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			svg.appendChild( path1 );
			svg.appendChild( path2 );
			container.appendChild( svg );

			styleSvgIcons( container, '#000000' );

			expect( path1 ).toHaveStyle( { fill: '#ffffff' } );
			expect( path2 ).toHaveStyle( { fill: '#ffffff' } );
		} );

		it( 'should handle container with no SVG paths', () => {
			const container = document.createElement( 'div' );

			// Should not throw.
			expect( () => {
				styleSvgIcons( container, '#000000' );
			} ).not.toThrow();
		} );

		it( 'should use white for dark colors', () => {
			const container = document.createElement( 'div' );
			const svg = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'svg'
			);
			const path = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			svg.appendChild( path );
			container.appendChild( svg );

			// A dark blue color.
			styleSvgIcons( container, '#000080' );

			expect( path ).toHaveStyle( { fill: '#ffffff' } );
		} );

		it( 'should use black for mid-light colors', () => {
			const container = document.createElement( 'div' );
			const svg = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'svg'
			);
			const path = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			svg.appendChild( path );
			container.appendChild( svg );

			// A light yellow color.
			styleSvgIcons( container, '#ffff00' );

			expect( path ).toHaveStyle( { fill: '#000000' } );
		} );
	} );

	describe( 'updateSeekControlLabel', () => {
		afterEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'updates the seek control label on the library slider', () => {
			const container = document.createElement( 'div' );
			const seekControl = document.createElement( 'div' );
			seekControl.className = 'waveform-container';
			container.appendChild( seekControl );
			document.body.appendChild( container );

			const instance = {
				container,
				options: {},
				applySeekLabel: jest.fn( ( label ) => {
					seekControl.setAttribute( 'aria-label', label );
				} ),
			};

			updateSeekControlLabel( instance, 'Updated Song' );

			expect( instance.options.seekLabel ).toBe( 'Updated Song' );
			expect( instance.applySeekLabel ).toHaveBeenCalledWith(
				'Updated Song'
			);
			expect( seekControl ).toHaveAttribute(
				'aria-label',
				'Updated Song'
			);
		} );
	} );

	describe( 'setupPlayButtonAccessibility', () => {
		it( 'should set aria-label to Play initially', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			setupPlayButtonAccessibility( container );

			expect( playBtn ).toHaveAttribute( 'aria-label', 'Play' );
		} );

		it( 'should change aria-label to Pause on play event', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			setupPlayButtonAccessibility( container );
			container.dispatchEvent( new CustomEvent( 'waveformplayer:play' ) );

			expect( playBtn ).toHaveAttribute( 'aria-label', 'Pause' );
		} );

		it( 'should change aria-label back to Play on pause event', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			setupPlayButtonAccessibility( container );
			container.dispatchEvent( new CustomEvent( 'waveformplayer:play' ) );
			container.dispatchEvent(
				new CustomEvent( 'waveformplayer:pause' )
			);

			expect( playBtn ).toHaveAttribute( 'aria-label', 'Play' );
		} );

		it( 'should change aria-label back to Play on ended event', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			setupPlayButtonAccessibility( container );
			container.dispatchEvent( new CustomEvent( 'waveformplayer:play' ) );
			container.dispatchEvent(
				new CustomEvent( 'waveformplayer:ended' )
			);

			expect( playBtn ).toHaveAttribute( 'aria-label', 'Play' );
		} );

		it( 'should return cleanup function that removes listeners', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			const cleanup = setupPlayButtonAccessibility( container );
			cleanup();

			// After cleanup, events should not change the label.
			container.dispatchEvent( new CustomEvent( 'waveformplayer:play' ) );
			expect( playBtn ).toHaveAttribute( 'aria-label', 'Play' );
		} );

		it( 'should do nothing when play button not found', () => {
			const container = document.createElement( 'div' );

			// Should not throw.
			expect( () =>
				setupPlayButtonAccessibility( container )
			).not.toThrow();
		} );

		it( 'stops play button clicks from bubbling to the container', () => {
			// The library focuses the container on any click that reaches it,
			// stealing focus from the play button. The click must not bubble.
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			const containerClick = jest.fn();
			container.addEventListener( 'click', containerClick );

			setupPlayButtonAccessibility( container );
			playBtn.dispatchEvent(
				new window.MouseEvent( 'click', { bubbles: true } )
			);

			expect( containerClick ).not.toHaveBeenCalled();
		} );

		it( 'cleanup removes the play button click handler', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			const containerClick = jest.fn();
			container.addEventListener( 'click', containerClick );

			const cleanup = setupPlayButtonAccessibility( container );
			cleanup();

			// After cleanup, the click is no longer stopped and reaches the container.
			playBtn.dispatchEvent(
				new window.MouseEvent( 'click', { bubbles: true } )
			);

			expect( containerClick ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'getNextShuffledTrack', () => {
		it( 'should never return the current track for a multi-track list', () => {
			const ids = [ 'a', 'b', 'c', 'd' ];
			let current = 'a';
			let played = [];
			for ( let i = 0; i < 100; i++ ) {
				const result = getNextShuffledTrack( ids, current, played );
				expect( result.nextId ).not.toBe( current );
				current = result.nextId;
				played = result.playedIds;
			}
		} );

		it( 'should play every track once before any repeats', () => {
			const ids = [ 'a', 'b', 'c', 'd' ];
			let current = 'a';
			let played = [ 'a' ];
			const cycle = [ 'a' ];
			// Advance three times to complete the first cycle of four tracks.
			for ( let i = 0; i < 3; i++ ) {
				const result = getNextShuffledTrack( ids, current, played );
				cycle.push( result.nextId );
				current = result.nextId;
				played = result.playedIds;
			}
			// All four tracks appear exactly once in the completed cycle.
			expect( [ ...cycle ].sort() ).toEqual( [ 'a', 'b', 'c', 'd' ] );
		} );

		it( 'should not repeat the just-played track across a cycle boundary', () => {
			const ids = [ 'a', 'b', 'c' ];
			// All three have played; current is the last one played.
			const result = getNextShuffledTrack( ids, 'c', [ 'a', 'b', 'c' ] );
			expect( result.nextId ).not.toBe( 'c' );
			// New cycle starts fresh with just the chosen track.
			expect( result.playedIds ).toEqual( [ result.nextId ] );
		} );

		it( 'should alternate deterministically for two tracks', () => {
			const first = getNextShuffledTrack( [ 'a', 'b' ], 'a', [] );
			expect( first.nextId ).toBe( 'b' );
			expect( first.playedIds ).toEqual( [ 'a', 'b' ] );

			const second = getNextShuffledTrack(
				[ 'a', 'b' ],
				'b',
				first.playedIds
			);
			expect( second.nextId ).toBe( 'a' );
			expect( second.playedIds ).toEqual( [ 'a' ] );
		} );

		it( 'should return the only track when the list has one entry', () => {
			expect( getNextShuffledTrack( [ 'a' ], 'a', [] ) ).toEqual( {
				nextId: 'a',
				playedIds: [ 'a' ],
			} );
		} );

		it( 'should identify when the current track completes a shuffle cycle', () => {
			expect(
				isShuffleCycleComplete( [ 'a', 'b', 'c' ], 'c', [ 'a', 'b' ] )
			).toBe( true );
			expect(
				isShuffleCycleComplete( [ 'a', 'b', 'c' ], 'b', [ 'a' ] )
			).toBe( false );
		} );
	} );

	describe( 'getPlaylistPlaybackAction', () => {
		let randomSpy;

		beforeEach( () => {
			randomSpy = jest.spyOn( Math, 'random' ).mockReturnValue( 0 );
		} );

		afterEach( () => {
			randomSpy.mockRestore();
		} );

		it( 'cycles repeat modes from off to playlist to current track', () => {
			expect( getNextRepeatMode( 'none' ) ).toBe( 'all' );
			expect( getNextRepeatMode( 'all' ) ).toBe( 'one' );
			expect( getNextRepeatMode( 'one' ) ).toBe( 'none' );
		} );

		it( 'replays the current track when repeat-one is active and a track ends', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'b', {
					repeatMode: 'one',
				} )
			).toEqual( {
				action: 'repeat',
				nextId: 'b',
				playedIds: [],
			} );
		} );

		it( 'replays the current track when repeat-one is active and skip is pressed', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'b', {
					repeatMode: 'one',
					isUserInitiated: true,
				} )
			).toEqual( {
				action: 'repeat',
				nextId: 'b',
				playedIds: [],
			} );
		} );

		it( 'loads the next track in order when repeat-playlist is active and skip is pressed', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'b', {
					repeatMode: 'all',
					isUserInitiated: true,
				} )
			).toEqual( {
				action: 'advance',
				nextId: 'c',
				playedIds: [],
			} );
		} );

		it( 'wraps to the first track when repeat-playlist is active and the last track ends', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'c', {
					repeatMode: 'all',
				} )
			).toEqual( {
				action: 'advance',
				nextId: 'a',
				playedIds: [],
			} );
		} );

		it( 'loads a shuffled track when shuffle is active and a track ends', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'a', {
					isShuffled: true,
				} )
			).toEqual( {
				action: 'advance',
				nextId: 'b',
				playedIds: [ 'a', 'b' ],
			} );
		} );

		it( 'loads a shuffled track when shuffle is active and skip is pressed', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'a', {
					isShuffled: true,
					isUserInitiated: true,
				} )
			).toEqual( {
				action: 'advance',
				nextId: 'b',
				playedIds: [ 'a', 'b' ],
			} );
		} );

		it( 'starts a new shuffle cycle when repeat-playlist and shuffle are active', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'c', {
					repeatMode: 'all',
					isShuffled: true,
					playedTracks: [ 'a', 'b', 'c' ],
				} )
			).toEqual( {
				action: 'advance',
				nextId: 'a',
				playedIds: [ 'a' ],
			} );
		} );

		it( 'loads a shuffled track when repeat-playlist and shuffle are active and skip is pressed', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'a', {
					repeatMode: 'all',
					isShuffled: true,
					isUserInitiated: true,
				} )
			).toEqual( {
				action: 'advance',
				nextId: 'b',
				playedIds: [ 'a', 'b' ],
			} );
		} );

		it( 'replays the current track when repeat-one and shuffle are active and a track ends', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'b', {
					repeatMode: 'one',
					isShuffled: true,
					playedTracks: [ 'a', 'b' ],
				} )
			).toEqual( {
				action: 'repeat',
				nextId: 'b',
				playedIds: [ 'a', 'b' ],
			} );
		} );

		it( 'replays the current track when repeat-one and shuffle are active and skip is pressed', () => {
			expect(
				getPlaylistPlaybackAction( [ 'a', 'b', 'c' ], 'a', {
					repeatMode: 'one',
					isShuffled: true,
					playedTracks: [ 'a', 'b' ],
					isUserInitiated: true,
				} )
			).toEqual( {
				action: 'repeat',
				nextId: 'a',
				playedIds: [ 'a', 'b' ],
			} );
		} );
	} );

	describe( 'setupPlaylistControls', () => {
		const createContainer = () => {
			const container = document.createElement( 'div' );
			document.body.appendChild( container );
			return container;
		};

		afterEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'sets aria-pressed on shuffle and repeat to match initial state', () => {
			const container = createContainer();
			setupPlaylistControls( container, {}, true, 'none' );

			expect(
				container.querySelector( '[aria-label="Shuffle"]' )
			).toHaveAttribute( 'aria-pressed', 'true' );
			expect(
				container.querySelector( '[aria-label="Repeat off"]' )
			).toHaveAttribute( 'aria-pressed', 'false' );
			expect(
				container.querySelector( '[aria-label="Repeat off"]' )
			).toHaveAttribute( 'data-repeat-mode', 'none' );
		} );

		it( 'does not put aria-pressed on the prev/next action buttons', () => {
			const container = createContainer();
			setupPlaylistControls( container, {} );

			expect(
				container.querySelector( '[aria-label="Previous track"]' )
			).not.toHaveAttribute( 'aria-pressed' );
			expect(
				container.querySelector( '[aria-label="Next track"]' )
			).not.toHaveAttribute( 'aria-pressed' );
		} );

		it( 'groups action buttons before toggle buttons', () => {
			const container = createContainer();
			setupPlaylistControls( container, {} );

			expect(
				[
					...container.querySelectorAll(
						'.wp-block-playlist__control-btn'
					),
				].map( ( button ) => button.getAttribute( 'aria-label' ) )
			).toEqual( [
				'Previous track',
				'Next track',
				'Repeat off',
				'Shuffle',
			] );
			expect(
				container.querySelectorAll(
					'.wp-block-playlist__controls-group'
				)
			).toHaveLength( 2 );
		} );

		it( 'toggles aria-pressed on shuffle click without using an is-active class', () => {
			const container = createContainer();
			const onShuffleToggle = jest.fn();
			setupPlaylistControls( container, { onShuffleToggle } );

			const shuffleBtn = container.querySelector(
				'[aria-label="Shuffle"]'
			);
			expect( shuffleBtn ).toHaveAttribute( 'aria-pressed', 'false' );

			shuffleBtn.click();
			expect( shuffleBtn ).toHaveAttribute( 'aria-pressed', 'true' );
			expect( onShuffleToggle ).toHaveBeenCalledTimes( 1 );

			shuffleBtn.click();
			expect( shuffleBtn ).toHaveAttribute( 'aria-pressed', 'false' );
			expect( onShuffleToggle ).toHaveBeenCalledTimes( 2 );

			// aria-pressed is the single source of truth; no is-active class.
			expect( shuffleBtn ).not.toHaveClass( 'is-active' );
		} );

		it( 'cycles the repeat button through playlist, current-track, and off states', () => {
			const container = createContainer();
			const onRepeatToggle = jest.fn();
			setupPlaylistControls( container, { onRepeatToggle } );

			const repeatBtn = container.querySelector(
				'[data-repeat-mode="none"]'
			);
			expect( repeatBtn ).toHaveAttribute( 'aria-label', 'Repeat off' );
			expect( repeatBtn ).toHaveAttribute( 'aria-pressed', 'false' );
			const repeatAllIcon = repeatBtn.innerHTML;

			repeatBtn.click();
			expect( repeatBtn ).toHaveAttribute(
				'aria-label',
				'Repeat playlist'
			);
			expect( repeatBtn ).toHaveAttribute( 'aria-pressed', 'true' );
			expect( repeatBtn ).toHaveAttribute( 'data-repeat-mode', 'all' );
			expect( repeatBtn.innerHTML ).toBe( repeatAllIcon );
			expect( onRepeatToggle ).toHaveBeenLastCalledWith( 'all' );

			repeatBtn.click();
			expect( repeatBtn ).toHaveAttribute(
				'aria-label',
				'Repeat current track'
			);
			expect( repeatBtn ).toHaveAttribute( 'aria-pressed', 'true' );
			expect( repeatBtn ).toHaveAttribute( 'data-repeat-mode', 'one' );
			expect( repeatBtn.innerHTML ).not.toBe( repeatAllIcon );
			expect( onRepeatToggle ).toHaveBeenLastCalledWith( 'one' );

			repeatBtn.click();
			expect( repeatBtn ).toHaveAttribute( 'aria-label', 'Repeat off' );
			expect( repeatBtn ).toHaveAttribute( 'aria-pressed', 'false' );
			expect( repeatBtn ).toHaveAttribute( 'data-repeat-mode', 'none' );
			expect( repeatBtn.innerHTML ).toBe( repeatAllIcon );
			expect( onRepeatToggle ).toHaveBeenLastCalledWith( 'none' );
			expect( onRepeatToggle ).toHaveBeenCalledTimes( 3 );
		} );
	} );

	describe( 'replayWaveformPlayerTrack', () => {
		it( 'seeks to the start of the current track and plays it', () => {
			const instance = {
				seekTo: jest.fn(),
				play: jest.fn().mockReturnValue( Promise.resolve() ),
			};

			replayWaveformPlayerTrack( instance );

			expect( instance.seekTo ).toHaveBeenCalledWith( 0 );
			expect( instance.play ).toHaveBeenCalled();
		} );
	} );

	describe( 'logPlayError', () => {
		let consoleErrorSpy;

		beforeEach( () => {
			consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );
		} );

		afterEach( () => {
			consoleErrorSpy.mockRestore();
		} );

		it( 'should not log AbortError', () => {
			const abortError = new DOMException( 'Aborted', 'AbortError' );

			logPlayError( abortError );

			expect( consoleErrorSpy ).not.toHaveBeenCalled();
		} );

		it( 'should log other errors', () => {
			const otherError = new Error( 'Some other error' );

			logPlayError( otherError );

			expect( consoleErrorSpy ).toHaveBeenCalledWith(
				'Playlist play error:',
				otherError
			);
		} );

		it( 'should log NotAllowedError', () => {
			const notAllowedError = new DOMException(
				'Not allowed',
				'NotAllowedError'
			);

			logPlayError( notAllowedError );

			expect( consoleErrorSpy ).toHaveBeenCalledWith(
				'Playlist play error:',
				notAllowedError
			);
		} );
	} );
} );
