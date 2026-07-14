/**
 * External dependencies
 */
import '@testing-library/jest-dom';

/**
 * Internal dependencies
 */
import {
	applyWaveformPlayerStyles,
	createWaveformContainer,
	getWaveformColors,
	getWaveformGradientStops,
	styleSvgIcons,
	setupPlayButtonAccessibility,
	setupPlayButtonArtwork,
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

		it( 'serializes gradient color arrays and direction attributes', () => {
			const container = createWaveformContainer( {
				...basePlayerData,
				waveformColor: [
					'rgba(255, 0, 0, 0.3)',
					'rgba(0, 0, 255, 0.3)',
				],
				progressColor: [
					'rgba(255, 0, 0, 0.6)',
					'rgba(0, 0, 255, 0.6)',
				],
				waveformGradient: 'horizontal',
			} );

			expect( container ).toHaveAttribute(
				'data-waveform-color',
				'["rgba(255, 0, 0, 0.3)","rgba(0, 0, 255, 0.3)"]'
			);
			expect( container ).toHaveAttribute(
				'data-progress-color',
				'["rgba(255, 0, 0, 0.6)","rgba(0, 0, 255, 0.6)"]'
			);
			expect( container ).toHaveAttribute(
				'data-waveform-gradient',
				'horizontal'
			);
		} );
	} );

	describe( 'getWaveformColors', () => {
		it( 'derives waveform colors from the computed text color', () => {
			const element = document.createElement( 'div' );
			element.style.color = '#336699';
			document.body.appendChild( element );

			const colors = getWaveformColors( element );

			expect( colors ).toEqual( {
				textColor: 'rgb(51, 102, 153)',
				waveformColor: 'rgba(51, 102, 153, 0.3)',
				progressColor: 'rgba(51, 102, 153, 0.6)',
			} );

			element.remove();
		} );

		it( 'uses explicit text and waveform color values when provided', () => {
			const element = document.createElement( 'div' );

			const colors = getWaveformColors( element, '#ff0000', '#0000ff' );

			expect( colors ).toEqual( {
				textColor: '#0000ff',
				waveformColor: 'rgba(255, 0, 0, 0.3)',
				progressColor: 'rgba(255, 0, 0, 0.6)',
			} );
		} );

		it( 'uses gradient stops when a waveform gradient is provided', () => {
			const element = document.createElement( 'div' );

			const colors = getWaveformColors(
				element,
				undefined,
				'#0000ff',
				'linear-gradient(90deg,rgb(255,0,0) 0%,rgb(0,0,255) 100%)'
			);

			expect( colors ).toEqual( {
				textColor: '#0000ff',
				waveformColor: [
					'rgba(255, 0, 0, 0.3)',
					'rgba(0, 0, 255, 0.3)',
				],
				progressColor: [
					'rgba(255, 0, 0, 0.6)',
					'rgba(0, 0, 255, 0.6)',
				],
				waveformGradient: 'horizontal',
			} );
		} );

		it( 'maps CSS gradient side-or-corner directions for waveform gradients', () => {
			const element = document.createElement( 'div' );

			expect(
				getWaveformColors(
					element,
					undefined,
					'#0000ff',
					'linear-gradient(to right,rgb(255,0,0) 0%,rgb(0,0,255) 100%)'
				).waveformGradient
			).toBe( 'horizontal' );
			expect(
				getWaveformColors(
					element,
					undefined,
					'#0000ff',
					'linear-gradient(to bottom right,rgb(255,0,0) 0%,rgb(0,0,255) 100%)'
				).waveformGradient
			).toBe( 'diagonal' );
		} );
	} );

	describe( 'getWaveformGradientStops', () => {
		it( 'extracts color stops from a CSS gradient value', () => {
			expect(
				getWaveformGradientStops(
					'linear-gradient(135deg,rgb(255,0,0) 0%,rgba(0,0,255,0.8) 100%)'
				)
			).toEqual( [ 'rgb(255,0,0)', 'rgba(0,0,255,0.8)' ] );
		} );
	} );

	describe( 'applyWaveformPlayerStyles', () => {
		it( 'applies the waveform background color', () => {
			const container = document.createElement( 'div' );
			const waveformContainer = document.createElement( 'div' );
			waveformContainer.className = 'waveform-container';
			container.appendChild( waveformContainer );

			applyWaveformPlayerStyles( container, {
				backgroundColor: '#ffeeaa',
			} );

			expect( waveformContainer ).toHaveStyle( {
				backgroundColor: '#ffeeaa',
			} );
		} );

		it( 'applies the waveform background gradient', () => {
			const container = document.createElement( 'div' );
			const waveformContainer = document.createElement( 'div' );
			waveformContainer.className = 'waveform-container';
			container.appendChild( waveformContainer );

			applyWaveformPlayerStyles( container, {
				backgroundGradient:
					'linear-gradient(90deg,#ff0000 0%,#0000ff 100%)',
			} );

			expect( waveformContainer ).toHaveStyle( {
				background: 'linear-gradient(90deg,#ff0000 0%,#0000ff 100%)',
			} );
		} );

		it( 'applies the waveform player text color variables', () => {
			const container = document.createElement( 'div' );

			applyWaveformPlayerStyles( container, {
				textColor: '#0000ff',
			} );

			expect( container ).toHaveStyle( {
				'--wfp-text-color': '#0000ff',
				'--wfp-text-secondary-color': '#0000ff',
			} );
		} );

		it( 'applies the waveform player play button color variable', () => {
			const container = document.createElement( 'div' );

			applyWaveformPlayerStyles( container, {
				playButtonColor: '#ff0000',
			} );

			expect( container ).toHaveStyle( {
				'--wfp-button-color': '#ff0000',
			} );
		} );

		it( 'applies the waveform player play button gradient', () => {
			const container = document.createElement( 'div' );
			const playButton = document.createElement( 'button' );
			playButton.className = 'waveform-btn';
			container.appendChild( playButton );

			applyWaveformPlayerStyles( container, {
				playButtonGradient:
					'linear-gradient(90deg,#ff0000 0%,#0000ff 100%)',
			} );

			expect( playButton ).toHaveStyle( {
				background: 'linear-gradient(90deg,#ff0000 0%,#0000ff 100%)',
			} );
			expect( container ).toHaveStyle( {
				'--wfp-button-color': '#0000ff',
			} );
		} );

		it( 'removes the waveform background color when cleared', () => {
			const container = document.createElement( 'div' );
			const waveformContainer = document.createElement( 'div' );
			waveformContainer.className = 'waveform-container';
			waveformContainer.style.backgroundColor = '#ffeeaa';
			container.appendChild( waveformContainer );

			applyWaveformPlayerStyles( container );

			expect( waveformContainer ).not.toHaveStyle( {
				backgroundColor: '#ffeeaa',
			} );
		} );

		it( 'removes the waveform player text color variables when cleared', () => {
			const container = document.createElement( 'div' );
			container.style.setProperty( '--wfp-text-color', '#0000ff' );
			container.style.setProperty(
				'--wfp-text-secondary-color',
				'#0000ff'
			);

			applyWaveformPlayerStyles( container );

			expect( container ).not.toHaveStyle( {
				'--wfp-text-color': '#0000ff',
				'--wfp-text-secondary-color': '#0000ff',
			} );
		} );

		it( 'removes the waveform player play button color variable when cleared', () => {
			const container = document.createElement( 'div' );
			container.style.setProperty( '--wfp-button-color', '#ff0000' );

			applyWaveformPlayerStyles( container );

			expect( container ).not.toHaveStyle( {
				'--wfp-button-color': '#ff0000',
			} );
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
		it( 'should set artwork as the play button background', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			const artworkEl = document.createElement( 'img' );
			artworkEl.src = 'https://example.com/cover.jpg';
			container.append( playBtn, artworkEl );

			setupPlayButtonArtwork(
				container,
				'https://example.com/cover.jpg'
			);

			expect( container ).toHaveClass( 'has-play-button-artwork' );
			expect(
				container.style.getPropertyValue(
					'--wp--playlist--play-button-artwork'
				)
			).toBe( 'url("https://example.com/cover.jpg")' );
			expect( artworkEl.parentElement ).toBe( container );
		} );

		it( 'should escape artwork URLs for CSS usage', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			setupPlayButtonArtwork(
				container,
				'https://example.com/cover "quoted".jpg'
			);

			expect(
				container.style.getPropertyValue(
					'--wp--playlist--play-button-artwork'
				)
			).toBe( 'url("https://example.com/cover \\"quoted\\".jpg")' );
		} );

		it( 'should not modify play button icon paths', () => {
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
				'https://example.com/cover.jpg'
			);

			expect( path ).not.toHaveStyle( { fill: '#ffffff' } );
		} );

		it( 'should set artwork state when play button is missing', () => {
			const container = document.createElement( 'div' );
			const artworkEl = document.createElement( 'img' );
			container.appendChild( artworkEl );

			expect( () => {
				setupPlayButtonArtwork(
					container,
					'https://example.com/cover.jpg'
				);
			} ).not.toThrow();
			expect( container ).toHaveClass( 'has-play-button-artwork' );
			expect( artworkEl.parentElement ).toBe( container );
		} );

		it( 'should set button artwork when artwork element is missing', () => {
			const container = document.createElement( 'div' );
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			expect( () => {
				setupPlayButtonArtwork(
					container,
					'https://example.com/cover.jpg'
				);
			} ).not.toThrow();
			expect( container ).toHaveClass( 'has-play-button-artwork' );
			expect(
				container.style.getPropertyValue(
					'--wp--playlist--play-button-artwork'
				)
			).toBe( 'url("https://example.com/cover.jpg")' );
		} );

		it( 'should clear button artwork when artwork URL is empty', () => {
			const container = document.createElement( 'div' );
			container.className = 'has-play-button-artwork';
			container.style.setProperty(
				'--wp--playlist--play-button-artwork',
				'url("https://example.com/cover.jpg")'
			);
			const playBtn = document.createElement( 'button' );
			playBtn.className = 'waveform-btn';
			container.appendChild( playBtn );

			setupPlayButtonArtwork( container, '' );

			expect( container ).not.toHaveClass( 'has-play-button-artwork' );
			expect(
				container.style.getPropertyValue(
					'--wp--playlist--play-button-artwork'
				)
			).toBe( '' );
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
