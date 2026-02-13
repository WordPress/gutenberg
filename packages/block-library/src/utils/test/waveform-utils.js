/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import {
	createWaveformContainer,
	styleSvgIcons,
	setupPlayButtonAccessibility,
	logPlayError,
} from '../waveform-utils';

describe( 'Waveform utilities', () => {
	describe( 'createWaveformContainer', () => {
		it( 'should create a container with required data attributes', () => {
			const container = createWaveformContainer( {
				url: 'https://example.com/song.mp3',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				buttonColor: '#000000',
			} );

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

		it( 'should set title as data-title attribute', () => {
			const container = createWaveformContainer( {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				buttonColor: '#000000',
			} );

			expect( container ).toHaveAttribute( 'data-title', 'My Song' );
		} );

		it( 'should set artist as data-subtitle attribute', () => {
			const container = createWaveformContainer( {
				url: 'https://example.com/song.mp3',
				artist: 'The Artist',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				buttonColor: '#000000',
			} );

			expect( container ).toHaveAttribute(
				'data-subtitle',
				'The Artist'
			);
		} );

		it( 'should set artwork as data-artwork attribute', () => {
			const container = createWaveformContainer( {
				url: 'https://example.com/song.mp3',
				artwork: 'https://example.com/cover.jpg',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				buttonColor: '#000000',
			} );

			expect( container ).toHaveAttribute(
				'data-artwork',
				'https://example.com/cover.jpg'
			);
		} );

		it( 'should not set optional attributes when not provided', () => {
			const container = createWaveformContainer( {
				url: 'https://example.com/song.mp3',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				buttonColor: '#000000',
			} );

			expect( container ).not.toHaveAttribute( 'data-title' );
			expect( container ).not.toHaveAttribute( 'data-subtitle' );
			expect( container ).not.toHaveAttribute( 'data-artwork' );
		} );

		it( 'should use custom height when provided', () => {
			const container = createWaveformContainer( {
				url: 'https://example.com/song.mp3',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				buttonColor: '#000000',
				height: 150,
			} );

			expect( container ).toHaveAttribute( 'data-height', '150' );
		} );

		it( 'should use default height of 100 when not provided', () => {
			const container = createWaveformContainer( {
				url: 'https://example.com/song.mp3',
				waveformColor: 'rgba(0, 0, 0, 0.3)',
				progressColor: 'rgba(0, 0, 0, 0.6)',
				buttonColor: '#000000',
			} );

			expect( container ).toHaveAttribute( 'data-height', '100' );
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

		it( 'should use white for mid-dark colors', () => {
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

	describe( 'setupPlayButtonAccessibility', () => {
		it( 'should set aria-label and role on play button', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			setupPlayButtonAccessibility( container, 'Play My Song' );

			expect( playBtn ).toHaveAttribute( 'aria-label', 'Play My Song' );
			expect( playBtn ).toHaveAttribute( 'role', 'button' );
		} );

		it( 'should return cleanup function that removes event listener', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			const cleanup = setupPlayButtonAccessibility(
				container,
				'Play My Song'
			);

			expect( typeof cleanup ).toBe( 'function' );
			// Cleanup should not throw.
			expect( () => cleanup() ).not.toThrow();
		} );

		it( 'should return no-op cleanup when play button not found', () => {
			const container = document.createElement( 'div' );

			const cleanup = setupPlayButtonAccessibility(
				container,
				'Play My Song'
			);

			expect( typeof cleanup ).toBe( 'function' );
			expect( () => cleanup() ).not.toThrow();
		} );

		it( 'should add keyboard handler for seeking', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			// Create a mock audio element.
			const audio = document.createElement( 'audio' );
			Object.defineProperty( audio, 'duration', { value: 100 } );
			audio.currentTime = 50;
			container.appendChild( audio );

			setupPlayButtonAccessibility( container, 'Play My Song' );

			// Simulate ArrowRight keydown.
			const rightEvent = new window.KeyboardEvent( 'keydown', {
				key: 'ArrowRight',
			} );
			playBtn.dispatchEvent( rightEvent );

			expect( audio.currentTime ).toBe( 55 ); // 50 + 5

			// Simulate ArrowLeft keydown.
			const leftEvent = new window.KeyboardEvent( 'keydown', {
				key: 'ArrowLeft',
			} );
			playBtn.dispatchEvent( leftEvent );

			expect( audio.currentTime ).toBe( 50 ); // 55 - 5
		} );

		it( 'should not seek past audio boundaries', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			const audio = document.createElement( 'audio' );
			Object.defineProperty( audio, 'duration', { value: 100 } );
			audio.currentTime = 2;
			container.appendChild( audio );

			setupPlayButtonAccessibility( container, 'Play My Song' );

			// Seek left past 0.
			const leftEvent = new window.KeyboardEvent( 'keydown', {
				key: 'ArrowLeft',
			} );
			playBtn.dispatchEvent( leftEvent );

			expect( audio.currentTime ).toBe( 0 ); // Clamped to 0

			// Set near end and seek right past duration.
			audio.currentTime = 98;
			const rightEvent = new window.KeyboardEvent( 'keydown', {
				key: 'ArrowRight',
			} );
			playBtn.dispatchEvent( rightEvent );

			expect( audio.currentTime ).toBe( 100 ); // Clamped to duration
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
