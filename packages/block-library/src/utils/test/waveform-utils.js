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
	setupPlayButtonArtwork,
	logPlayError,
	getNextShuffledTrack,
	refreshWaveformPlayerColors,
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
	} );

	describe( 'setupPlayButtonArtwork', () => {
		it( 'should move artwork into the play button', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			const artworkEl = document.createElement( 'img' );
			artworkEl.src = 'https://example.com/cover.jpg';
			container.append( playBtn, artworkEl );

			setupPlayButtonArtwork(
				container,
				{ artworkEl },
				'https://example.com/cover.jpg'
			);

			expect( playBtn ).toHaveClass( 'has-artwork' );
			expect( artworkEl ).toHaveClass(
				'wp-block-playlist__play-button-artwork'
			);
			expect( artworkEl ).toHaveAttribute( 'aria-hidden', 'true' );
			expect( artworkEl ).toHaveAttribute( 'alt', '' );
			expect( playBtn.firstChild ).toBe( artworkEl );
		} );

		it( 'should force play button icon paths to white', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			const svg = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'svg'
			);
			const path = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			const artworkEl = document.createElement( 'img' );
			svg.appendChild( path );
			playBtn.appendChild( svg );
			container.append( playBtn, artworkEl );

			setupPlayButtonArtwork(
				container,
				{ artworkEl },
				'https://example.com/cover.jpg'
			);

			expect( path ).toHaveStyle( { fill: '#ffffff' } );
		} );

		it( 'should do nothing when play button is missing', () => {
			const container = document.createElement( 'div' );
			const artworkEl = document.createElement( 'img' );
			container.appendChild( artworkEl );

			expect( () =>
				setupPlayButtonArtwork(
					container,
					{ artworkEl },
					'https://example.com/cover.jpg'
				)
			).not.toThrow();
			expect( artworkEl.parentElement ).toBe( container );
		} );

		it( 'should create button artwork when artwork element is missing', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			expect( () =>
				setupPlayButtonArtwork(
					container,
					{},
					'https://example.com/cover.jpg'
				)
			).not.toThrow();
			expect( playBtn ).toHaveClass( 'has-artwork' );
			expect(
				playBtn.querySelector(
					'.wp-block-playlist__play-button-artwork'
				)
			).toHaveAttribute( 'src', 'https://example.com/cover.jpg' );
		} );

		it( 'should remove existing button artwork when artwork URL is empty', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn has-artwork';
			const artworkEl = document.createElement( 'img' );
			artworkEl.className = 'wp-block-playlist__play-button-artwork';
			playBtn.appendChild( artworkEl );
			container.appendChild( playBtn );

			setupPlayButtonArtwork( container, { artworkEl }, '' );

			expect( playBtn ).not.toHaveClass( 'has-artwork' );
			expect(
				playBtn.querySelector(
					'.wp-block-playlist__play-button-artwork'
				)
			).toBeNull();
		} );
	} );

	describe( 'refreshWaveformPlayerColors', () => {
		function createPlayerForColorRefresh() {
			const element = document.createElement( 'div' );
			element.style.color = 'rgb(10, 20, 30)';
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			const svg = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'svg'
			);
			const path = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'path'
			);
			svg.appendChild( path );
			playBtn.appendChild( svg );
			container.appendChild( playBtn );
			element.appendChild( container );
			document.body.appendChild( element );

			const player = {
				container,
				colorState: {
					textColor: 'rgb(0, 0, 0)',
					waveformColor: 'rgba(0, 0, 0, 0.3)',
					progressColor: 'rgba(0, 0, 0, 0.6)',
				},
				instance: {
					options: {},
					drawWaveform: jest.fn(),
				},
			};

			return { element, player, playBtn };
		}

		afterEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'updates cached colors and redraws the player', () => {
			const { element, player, playBtn } = createPlayerForColorRefresh();

			expect( refreshWaveformPlayerColors( player, element ) ).toBe(
				true
			);

			expect( player.colorState ).toMatchObject( {
				textColor: 'rgb(10, 20, 30)',
				waveformColor: 'rgba(10, 20, 30, 0.3)',
				progressColor: 'rgba(10, 20, 30, 0.6)',
			} );
			expect( player.instance.options ).toMatchObject( {
				waveformColor: 'rgba(10, 20, 30, 0.3)',
				progressColor: 'rgba(10, 20, 30, 0.6)',
				buttonColor: 'rgb(10, 20, 30)',
			} );
			expect( player.container ).toHaveAttribute(
				'data-button-color',
				'rgb(10, 20, 30)'
			);
			expect( playBtn ).toHaveStyle( { color: 'rgb(10, 20, 30)' } );
			expect( player.instance.drawWaveform ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does not redraw when colors are unchanged', () => {
			const { element, player } = createPlayerForColorRefresh();

			refreshWaveformPlayerColors( player, element );
			player.instance.drawWaveform.mockClear();

			expect( refreshWaveformPlayerColors( player, element ) ).toBe(
				false
			);
			expect( player.instance.drawWaveform ).not.toHaveBeenCalled();
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
			setupPlaylistControls( container, {}, true, false );

			expect(
				container.querySelector( '[aria-label="Shuffle"]' )
			).toHaveAttribute( 'aria-pressed', 'true' );
			expect(
				container.querySelector( '[aria-label="Repeat"]' )
			).toHaveAttribute( 'aria-pressed', 'false' );
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

		it( 'toggles the repeat button aria-pressed independently', () => {
			const container = createContainer();
			const onRepeatToggle = jest.fn();
			setupPlaylistControls( container, { onRepeatToggle }, false, true );

			const repeatBtn = container.querySelector(
				'[aria-label="Repeat"]'
			);
			expect( repeatBtn ).toHaveAttribute( 'aria-pressed', 'true' );

			repeatBtn.click();
			expect( repeatBtn ).toHaveAttribute( 'aria-pressed', 'false' );
			expect( onRepeatToggle ).toHaveBeenCalledTimes( 1 );
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
