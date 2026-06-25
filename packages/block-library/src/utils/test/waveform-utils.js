/**
 * @jest-environment jsdom
 */

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
	setupSeekControlAccessibility,
	updateSeekControlLabel,
	logPlayError,
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
			expect( container ).toHaveAttribute( 'data-height', '100' );
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
		} );

		it( 'should set optional attributes when provided', () => {
			const container = createWaveformContainer( {
				...basePlayerData,
				title: 'My Song',
				artist: 'The Artist',
				artwork: 'https://example.com/cover.jpg',
			} );

			expect( container ).toHaveAttribute( 'data-title', 'My Song' );
			expect( container ).toHaveAttribute(
				'data-subtitle',
				'The Artist'
			);
			expect( container ).toHaveAttribute(
				'data-artwork',
				'https://example.com/cover.jpg'
			);
		} );

		it( 'should not set optional attributes when not provided', () => {
			const container = createWaveformContainer( basePlayerData );

			expect( container ).not.toHaveAttribute( 'data-title' );
			expect( container ).not.toHaveAttribute( 'data-subtitle' );
			expect( container ).not.toHaveAttribute( 'data-artwork' );
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

	describe( 'setupSeekControlAccessibility', () => {
		function createSeekControlFixture( {
			duration = 180,
			currentTime = 45,
		} = {} ) {
			const container = document.createElement( 'div' );
			const seekControl = document.createElement( 'div' );
			const audio = document.createElement( 'audio' );

			seekControl.className = 'waveform-container';
			container.appendChild( seekControl );
			document.body.appendChild( container );

			Object.defineProperty( audio, 'duration', {
				configurable: true,
				writable: true,
				value: duration,
			} );
			Object.defineProperty( audio, 'currentTime', {
				configurable: true,
				writable: true,
				value: currentTime,
			} );

			const instance = {
				audio,
				container,
				options: {},
				seekTo: jest.fn(),
			};

			return { audio, container, instance, seekControl };
		}

		afterEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'sets slider semantics and current time attributes', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture();

			setupSeekControlAccessibility( container, instance, {
				label: 'My Song',
			} );

			expect( seekControl ).toHaveAttribute( 'tabindex', '0' );
			expect( seekControl ).toHaveAttribute( 'role', 'slider' );
			expect( seekControl ).toHaveAttribute( 'aria-label', 'My Song' );
			expect( seekControl ).toHaveAttribute( 'aria-valuemin', '0' );
			expect( seekControl ).toHaveAttribute( 'aria-valuemax', '180' );
			expect( seekControl ).toHaveAttribute( 'aria-valuenow', '45' );
			expect( seekControl ).toHaveAttribute(
				'aria-valuetext',
				'0:45 of 3:00'
			);
		} );

		it( 'keeps aria value attributes in sync on time and duration changes', () => {
			const { audio, container, instance, seekControl } =
				createSeekControlFixture( {
					duration: 60,
					currentTime: 0,
				} );

			setupSeekControlAccessibility( container, instance );

			audio.duration = 90;
			audio.currentTime = 30;
			audio.dispatchEvent( new Event( 'durationchange' ) );

			expect( seekControl ).toHaveAttribute( 'aria-valuemax', '90' );
			expect( seekControl ).toHaveAttribute( 'aria-valuenow', '30' );
			expect( seekControl ).toHaveAttribute(
				'aria-valuetext',
				'0:30 of 1:30'
			);

			audio.currentTime = 45;
			instance.options.onTimeUpdate( 45, 90, instance );

			expect( seekControl ).toHaveAttribute( 'aria-valuenow', '45' );
			expect( seekControl ).toHaveAttribute(
				'aria-valuetext',
				'0:45 of 1:30'
			);
		} );

		it( 'seeks exactly once on arrow keydown', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( {
					duration: 60,
					currentTime: 10,
				} );

			setupSeekControlAccessibility( container, instance );

			container.addEventListener( 'keydown', () => {
				instance.seekTo( 20 );
			} );
			seekControl.focus();
			seekControl.dispatchEvent(
				new window.KeyboardEvent( 'keydown', {
					key: 'ArrowRight',
					bubbles: true,
					cancelable: true,
				} )
			);

			expect( instance.seekTo ).toHaveBeenCalledTimes( 1 );
			expect( instance.seekTo ).toHaveBeenCalledWith( 5 );
		} );

		it( 'seeks from the current media time while playing', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( {
					duration: 60,
					currentTime: 10,
				} );

			setupSeekControlAccessibility( container, instance );

			container.dispatchEvent( new CustomEvent( 'waveformplayer:play' ) );
			seekControl.dispatchEvent(
				new window.KeyboardEvent( 'keydown', {
					key: 'ArrowRight',
					bubbles: true,
					cancelable: true,
				} )
			);

			expect( instance.seekTo ).toHaveBeenCalledWith( 15 );
		} );

		it( 'seeks from the latest reported media time after an external paused seek', () => {
			const { audio, container, instance, seekControl } =
				createSeekControlFixture( {
					duration: 60,
					currentTime: 10,
				} );

			setupSeekControlAccessibility( container, instance );

			audio.currentTime = 30;
			instance.options.onTimeUpdate( 30, 60, instance );
			seekControl.dispatchEvent(
				new window.KeyboardEvent( 'keydown', {
					key: 'ArrowRight',
					bubbles: true,
					cancelable: true,
				} )
			);

			expect( instance.seekTo ).toHaveBeenCalledWith( 35 );
		} );

		it( 'maps vertical arrows to seeking', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( {
					duration: 60,
					currentTime: 10,
				} );

			setupSeekControlAccessibility( container, instance );

			seekControl.dispatchEvent(
				new window.KeyboardEvent( 'keydown', {
					key: 'ArrowUp',
					bubbles: true,
					cancelable: true,
				} )
			);
			expect( instance.seekTo ).toHaveBeenLastCalledWith( 5 );

			seekControl.dispatchEvent(
				new window.KeyboardEvent( 'keydown', {
					key: 'ArrowDown',
					bubbles: true,
					cancelable: true,
				} )
			);
			expect( instance.seekTo ).toHaveBeenLastCalledWith( 0 );
		} );

		it( 'uses the larger seek step when shift is pressed', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( {
					duration: 60,
					currentTime: 10,
				} );

			setupSeekControlAccessibility( container, instance );

			seekControl.dispatchEvent(
				new window.KeyboardEvent( 'keydown', {
					key: 'ArrowRight',
					shiftKey: true,
					bubbles: true,
					cancelable: true,
				} )
			);

			expect( instance.seekTo ).toHaveBeenCalledWith( 10 );
		} );

		it( 'updates the seek control label', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture();

			setupSeekControlAccessibility( container, instance );
			updateSeekControlLabel( instance, 'Updated Song' );

			expect( seekControl ).toHaveAttribute(
				'aria-label',
				'Updated Song'
			);
		} );

		it( 'redirects focus from the player wrapper to the slider after waveform clicks', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture();

			container.addEventListener( 'click', () => {
				container.setAttribute( 'tabindex', '0' );
				container.focus();
			} );
			setupSeekControlAccessibility( container, instance );

			seekControl.dispatchEvent(
				new window.MouseEvent( 'click', {
					bubbles: true,
					clientX: 0,
				} )
			);

			expect( seekControl ).toHaveFocus();
		} );

		it( 'does not redirect play button activation to the slider', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture();
			const playButton = document.createElement( 'button' );
			container.prepend( playButton );

			container.addEventListener( 'click', () => {
				container.setAttribute( 'tabindex', '0' );
				container.focus();
			} );
			setupSeekControlAccessibility( container, instance );

			playButton.dispatchEvent(
				new window.MouseEvent( 'click', { bubbles: true } )
			);

			expect( container ).toHaveFocus();
			expect( seekControl ).not.toHaveFocus();
		} );

		it( 'renders the initial focus playhead at the beginning with a timestamp', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( { duration: 180, currentTime: 45 } );

			setupSeekControlAccessibility( container, instance );

			const playhead = seekControl.querySelector(
				'.waveform-seek-playhead'
			);
			expect( playhead ).not.toBeNull();
			expect( playhead ).toHaveStyle( { left: '0%' } );
			expect( playhead ).toHaveTextContent( '0:00' );
		} );

		it( 'moves the playhead as the current time changes while playing', () => {
			const { audio, container, instance, seekControl } =
				createSeekControlFixture( { duration: 180, currentTime: 45 } );

			setupSeekControlAccessibility( container, instance );

			container.dispatchEvent( new CustomEvent( 'waveformplayer:play' ) );
			audio.currentTime = 90;
			instance.options.onTimeUpdate( 90, 180, instance );

			const playhead = seekControl.querySelector(
				'.waveform-seek-playhead'
			);
			expect( playhead ).toHaveStyle( { left: '50%' } );
			expect( playhead ).toHaveTextContent( '1:30' );
		} );

		it( 'resets the focus playhead when playback ends', () => {
			const { audio, container, instance, seekControl } =
				createSeekControlFixture( { duration: 180, currentTime: 45 } );

			setupSeekControlAccessibility( container, instance );

			container.dispatchEvent( new CustomEvent( 'waveformplayer:play' ) );
			audio.currentTime = 90;
			instance.options.onTimeUpdate( 90, 180, instance );
			container.dispatchEvent(
				new CustomEvent( 'waveformplayer:ended' )
			);

			const playhead = seekControl.querySelector(
				'.waveform-seek-playhead'
			);
			expect( playhead ).toHaveStyle( { left: '0%' } );
			expect( playhead ).toHaveTextContent( '0:00' );
		} );

		it( 'moves the focus playhead to the clicked position while stopped', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( { duration: 180, currentTime: 0 } );
			seekControl.getBoundingClientRect = () => ( {
				left: 0,
				width: 200,
				top: 0,
				right: 200,
				bottom: 100,
				height: 100,
			} );

			setupSeekControlAccessibility( container, instance );

			seekControl.dispatchEvent(
				new window.MouseEvent( 'click', {
					bubbles: true,
					clientX: 100,
				} )
			);

			const playhead = seekControl.querySelector(
				'.waveform-seek-playhead'
			);
			expect( playhead ).toHaveStyle( { left: '50%' } );
			expect( playhead ).toHaveTextContent( '1:30' );
			expect( seekControl ).toHaveAttribute( 'aria-valuenow', '90' );
		} );

		it( 'shows a hover indicator and timestamp at the pointed position', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( { duration: 180, currentTime: 0 } );
			seekControl.getBoundingClientRect = () => ( {
				left: 0,
				width: 200,
				top: 0,
				right: 200,
				bottom: 100,
				height: 100,
			} );

			setupSeekControlAccessibility( container, instance );

			seekControl.dispatchEvent(
				new window.MouseEvent( 'pointermove', {
					bubbles: true,
					clientX: 100,
				} )
			);

			const hover = seekControl.querySelector( '.waveform-seek-hover' );
			expect( seekControl ).toHaveClass( 'is-seek-hovering' );
			expect( hover ).toHaveStyle( { left: '50%' } );
			expect( hover ).toHaveTextContent( '1:30' );

			seekControl.dispatchEvent(
				new window.MouseEvent( 'pointerleave', { bubbles: true } )
			);
			expect( seekControl ).not.toHaveClass( 'is-seek-hovering' );
		} );

		it( 'removes seek overlays on cleanup', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture();

			const cleanup = setupSeekControlAccessibility(
				container,
				instance
			);
			cleanup();

			expect(
				seekControl.querySelector( '.waveform-seek-playhead' )
			).toBeNull();
			expect(
				seekControl.querySelector( '.waveform-seek-hover' )
			).toBeNull();
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
