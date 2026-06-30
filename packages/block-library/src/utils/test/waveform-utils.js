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
	getWaveformColors,
	styleSvgIcons,
	setupPlayButtonAccessibility,
	setupSeekControlLocalization,
	updateSeekControlLabel,
	logPlayError,
} from '../waveform-utils';

// Base player data used across tests
const basePlayerData = {
	url: 'https://example.com/song.mp3',
	waveformColor: 'rgba(0, 0, 0, 0.3)',
	progressColor: 'rgba(0, 0, 0, 0.6)',
	buttonColor: '#000000',
	backgroundColor: '#ffffff',
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
			expect( container ).toHaveAttribute(
				'data-background-color',
				'#ffffff'
			);
			expect( container ).toHaveAttribute( 'data-seek-label', 'Seek' );
			expect( container ).toHaveStyle( {
				'--wp--playlist--waveform-bar-color': 'rgba(0, 0, 0, 0.3)',
				'--wp--playlist--waveform-background-color': '#ffffff',
				'--wp--playlist--waveform-button-background-color': '#000000',
				'--wp--playlist--waveform-button-icon-color': '#ffffff',
			} );
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
			expect( container ).toHaveAttribute(
				'data-subtitle',
				'The Artist'
			);
			expect( container ).toHaveAttribute(
				'data-artwork',
				'https://example.com/cover.jpg'
			);
			expect( container ).toHaveAttribute( 'data-seek-label', 'My Song' );
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

	describe( 'getWaveformColors', () => {
		it( 'should derive waveform colors from text and background colors', () => {
			const element = document.createElement( 'div' );
			element.style.color = '#000000';
			element.style.backgroundColor = '#ffffff';
			document.body.appendChild( element );

			expect( getWaveformColors( element ) ).toEqual( {
				textColor: 'rgb(0, 0, 0)',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				backgroundColor: 'rgb(255, 255, 255)',
			} );

			element.remove();
		} );

		it( 'should use the parent background when the player background is transparent', () => {
			const parent = document.createElement( 'div' );
			const element = document.createElement( 'div' );
			parent.style.backgroundColor = '#f0f0f0';
			parent.appendChild( element );
			document.body.appendChild( parent );

			expect( getWaveformColors( element ).backgroundColor ).toBe(
				'rgb(240, 240, 240)'
			);

			parent.remove();
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

	describe( 'setupSeekControlLocalization', () => {
		function createSeekControlFixture( {
			duration = 180,
			currentTime = 45,
		} = {} ) {
			const container = document.createElement( 'div' );
			const seekControl = document.createElement( 'div' );
			const audio = document.createElement( 'audio' );

			seekControl.className = 'waveform-container';
			seekControl.setAttribute( 'role', 'slider' );
			seekControl.setAttribute( 'tabindex', '0' );
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
				getSeekDuration: jest.fn( () => audio.duration ),
				getSeekCurrentTime: jest.fn( () => audio.currentTime ),
				updateSeekAccessibility: jest.fn( () => {
					seekControl.setAttribute(
						'aria-valuetext',
						`${ audio.currentTime } of ${ audio.duration }`
					);
				} ),
				applySeekLabel: jest.fn( ( label ) => {
					seekControl.setAttribute( 'aria-label', label );
				} ),
			};

			return { audio, container, instance, seekControl };
		}

		afterEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'sets the localized seek label on the library slider', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture();

			setupSeekControlLocalization( container, instance, {
				label: 'My Song',
			} );

			expect( instance.options.seekLabel ).toBe( 'My Song' );
			expect( instance.applySeekLabel ).toHaveBeenCalledWith( 'My Song' );
			expect( seekControl ).toHaveAttribute( 'aria-label', 'My Song' );
		} );

		it( 'localizes the seek value text', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( {
					duration: 180.6,
					currentTime: 45.731,
				} );

			setupSeekControlLocalization( container, instance, {
				valueText: '%1$s of %2$s',
			} );

			expect( seekControl ).toHaveAttribute(
				'aria-valuetext',
				'0:46 of 3:01'
			);
		} );

		it( 'substitutes non-positional and repeated value-text placeholders', () => {
			const nonPositional = createSeekControlFixture();
			setupSeekControlLocalization(
				nonPositional.container,
				nonPositional.instance,
				{ valueText: '%s of %s' }
			);
			expect( nonPositional.seekControl ).toHaveAttribute(
				'aria-valuetext',
				'0:45 of 3:00'
			);

			document.body.innerHTML = '';

			const repeated = createSeekControlFixture();
			setupSeekControlLocalization(
				repeated.container,
				repeated.instance,
				{ valueText: '%1$s / %1$s of %2$s' }
			);
			expect( repeated.seekControl ).toHaveAttribute(
				'aria-valuetext',
				'0:45 / 0:45 of 3:00'
			);
		} );

		it( 'keeps localized value text in sync with playback updates', () => {
			const { container, instance, seekControl } =
				createSeekControlFixture( { duration: 180, currentTime: 45 } );

			setupSeekControlLocalization( container, instance, {
				valueText: '%1$s of %2$s',
			} );
			instance.options.onTimeUpdate( 90, 180, instance );

			expect( seekControl ).toHaveAttribute(
				'aria-valuetext',
				'1:30 of 3:00'
			);
		} );

		it( 'keeps localized value text after the library refreshes seek accessibility', () => {
			const { audio, container, instance, seekControl } =
				createSeekControlFixture( { duration: 180, currentTime: 45 } );

			setupSeekControlLocalization( container, instance, {
				valueText: '%1$s sur %2$s',
			} );
			audio.currentTime = 90;
			instance.options.onTimeUpdate( 90, 180, instance );
			instance.updateSeekAccessibility();

			expect( seekControl ).toHaveAttribute(
				'aria-valuetext',
				'1:30 sur 3:00'
			);
		} );

		it( 'restores the original handlers on cleanup', () => {
			const { container, instance } = createSeekControlFixture();
			const originalOnTimeUpdate = jest.fn();
			const originalUpdateSeekAccessibility =
				instance.updateSeekAccessibility;
			instance.options.onTimeUpdate = originalOnTimeUpdate;

			const cleanup = setupSeekControlLocalization( container, instance );

			expect( instance.options.onTimeUpdate ).not.toBe(
				originalOnTimeUpdate
			);
			expect( instance.updateSeekAccessibility ).not.toBe(
				originalUpdateSeekAccessibility
			);
			cleanup();
			expect( instance.options.onTimeUpdate ).toBe(
				originalOnTimeUpdate
			);
			expect( instance.updateSeekAccessibility ).toBe(
				originalUpdateSeekAccessibility
			);
		} );

		it( 'updates the seek control label', () => {
			const { instance, seekControl } = createSeekControlFixture();

			updateSeekControlLabel( instance, 'Updated Song' );

			expect( instance.options.seekLabel ).toBe( 'Updated Song' );
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
