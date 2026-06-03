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
	formatTime,
	parseTime,
	styleSvgIcons,
	setupWaveformTimeMarkers,
	setupPlayButtonAccessibility,
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
	describe( 'formatTime', () => {
		it( 'should format seconds as m:ss', () => {
			expect( formatTime( 0 ) ).toBe( '0:00' );
			expect( formatTime( 9 ) ).toBe( '0:09' );
			expect( formatTime( 75 ) ).toBe( '1:15' );
			expect( formatTime( 600 ) ).toBe( '10:00' );
		} );

		it( 'should format invalid values as 0:00', () => {
			expect( formatTime( Number.NaN ) ).toBe( '0:00' );
			expect( formatTime( Infinity ) ).toBe( '0:00' );
			expect( formatTime( -1 ) ).toBe( '0:00' );
		} );
	} );

	describe( 'parseTime', () => {
		it( 'should parse formatted time strings to seconds', () => {
			expect( parseTime( '0:09' ) ).toBe( 9 );
			expect( parseTime( '1:15' ) ).toBe( 75 );
			expect( parseTime( '1:02:30' ) ).toBe( 3750 );
		} );

		it( 'should return null for invalid values', () => {
			expect( parseTime() ).toBeNull();
			expect( parseTime( '' ) ).toBeNull();
			expect( parseTime( '75' ) ).toBeNull();
			expect( parseTime( '1:bad' ) ).toBeNull();
		} );
	} );

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

	describe( 'setupWaveformTimeMarkers', () => {
		function createMarkerTestContext( {
			duration = 120,
			currentTime = 0,
		} = {} ) {
			const container = document.createElement( 'div' );
			container.innerHTML = `
				<div class="waveform-container">
					<canvas></canvas>
					<div class="waveform-markers"></div>
				</div>
			`;

			const waveformArea = container.querySelector(
				'.waveform-container'
			);
			waveformArea.getBoundingClientRect = jest.fn( () => ( {
				left: 10,
				width: 200,
			} ) );

			const audio = document.createElement( 'audio' );
			Object.defineProperty( audio, 'duration', {
				configurable: true,
				value: duration,
			} );
			Object.defineProperty( audio, 'currentTime', {
				configurable: true,
				value: currentTime,
			} );

			const instance = {
				audio,
				options: {},
				renderMarkers: jest.fn( () => {
					const markersContainer =
						container.querySelector( '.waveform-markers' );
					markersContainer.innerHTML = '';

					if (
						! Number.isFinite( audio.duration ) ||
						audio.duration <= 0
					) {
						return;
					}

					instance.options.markers?.forEach( ( marker ) => {
						const markerElement =
							document.createElement( 'button' );
						markerElement.className = 'waveform-marker';
						markerElement.style.left = `${
							( marker.time / audio.duration ) * 100
						}%`;
						markerElement.setAttribute(
							'aria-label',
							marker.label
						);
						markerElement.setAttribute( 'data-time', marker.time );

						const tooltip = document.createElement( 'span' );
						tooltip.className = 'waveform-marker-tooltip';
						tooltip.textContent = marker.label;
						markerElement.appendChild( tooltip );
						markersContainer.appendChild( markerElement );
					} );
				} ),
			};

			return { audio, container, instance, waveformArea };
		}

		it( 'should show current and end time markers', () => {
			const { container, instance } = createMarkerTestContext( {
				duration: 180,
				currentTime: 45,
			} );

			setupWaveformTimeMarkers( instance, container );

			const currentMarker = container.querySelector(
				'.wp-block-playlist__time-marker--current'
			);
			const endMarker = container.querySelector(
				'.wp-block-playlist__time-marker--end'
			);

			expect( currentMarker ).toHaveClass( 'is-visible' );
			expect( currentMarker ).toHaveStyle( { left: '25%' } );
			expect( currentMarker ).toHaveTextContent( '0:45' );
			expect( endMarker ).toHaveClass( 'is-visible' );
			expect( endMarker ).toHaveStyle( { left: '100%' } );
			expect( endMarker ).toHaveTextContent( '3:00' );
			expect( instance.renderMarkers ).toHaveBeenCalled();
			expect( instance.options.markers ).toEqual( [
				expect.objectContaining( {
					time: 45,
					label: '0:45',
				} ),
				expect.objectContaining( {
					time: 180,
					label: '3:00',
				} ),
			] );
		} );

		it( 'should update the current marker on player timeupdate', () => {
			const { audio, container, instance } = createMarkerTestContext();

			setupWaveformTimeMarkers( instance, container );
			Object.defineProperty( audio, 'currentTime', {
				configurable: true,
				value: 60,
			} );

			container.dispatchEvent(
				new CustomEvent( 'waveformplayer:timeupdate' )
			);

			const currentMarker = container.querySelector(
				'.wp-block-playlist__time-marker--current'
			);

			expect( currentMarker ).toHaveStyle( { left: '50%' } );
			expect( currentMarker ).toHaveTextContent( '1:00' );
		} );

		it( 'should update the hover marker on mouse move', () => {
			const { container, instance, waveformArea } =
				createMarkerTestContext();

			setupWaveformTimeMarkers( instance, container );

			waveformArea.dispatchEvent(
				new window.MouseEvent( 'mousemove', {
					clientX: 110,
				} )
			);

			const hoverMarker = container.querySelector(
				'.wp-block-playlist__time-marker--hover'
			);
			const hoverRegion = container.querySelector(
				'.wp-block-playlist__waveform-hover-region'
			);

			expect( waveformArea ).toHaveClass( 'is-hovering' );
			expect( hoverMarker ).toHaveClass( 'is-visible' );
			expect( hoverMarker ).toHaveStyle( { left: '50%' } );
			expect( hoverMarker ).toHaveTextContent( '1:00' );
			expect( hoverRegion ).toHaveStyle( { width: '50%' } );
		} );

		it( 'should use fallback duration for the hover marker', () => {
			const { container, instance, waveformArea } =
				createMarkerTestContext( {
					duration: Number.NaN,
				} );

			setupWaveformTimeMarkers( instance, container, '2:00' );

			waveformArea.dispatchEvent(
				new window.MouseEvent( 'mousemove', {
					clientX: 110,
				} )
			);

			const hoverMarker = container.querySelector(
				'.wp-block-playlist__time-marker--hover'
			);
			const endMarker = container.querySelector(
				'.wp-block-playlist__time-marker--end'
			);

			expect( hoverMarker ).toHaveClass( 'is-visible' );
			expect( hoverMarker ).toHaveTextContent( '1:00' );
			expect( endMarker ).toHaveTextContent( '2:00' );
		} );

		it( 'should hide the hover marker on mouse leave', () => {
			const { container, instance, waveformArea } =
				createMarkerTestContext();

			setupWaveformTimeMarkers( instance, container );

			waveformArea.dispatchEvent(
				new window.MouseEvent( 'mousemove', {
					clientX: 110,
				} )
			);
			waveformArea.dispatchEvent( new window.MouseEvent( 'mouseleave' ) );

			const hoverMarker = container.querySelector(
				'.wp-block-playlist__time-marker--hover'
			);
			const hoverRegion = container.querySelector(
				'.wp-block-playlist__waveform-hover-region'
			);

			expect( waveformArea ).not.toHaveClass( 'is-hovering' );
			expect( hoverMarker ).not.toHaveClass( 'is-visible' );
			expect( hoverRegion ).toHaveStyle( { width: '0' } );
		} );

		it( 'should remove marker elements on cleanup', () => {
			const { container, instance } = createMarkerTestContext();

			const cleanup = setupWaveformTimeMarkers( instance, container );
			cleanup();

			expect(
				container.querySelector( '.wp-block-playlist__time-marker' )
			).toBeNull();
			expect(
				container.querySelector(
					'.wp-block-playlist__waveform-hover-region'
				)
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
