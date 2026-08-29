import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const FIXTURE_ATTRIBUTE = 'data-player-fixture';

function createDeclarativePlayer( attributes = {} ) {
	const element = document.createElement( 'div' );
	element.setAttribute( 'data-waveform-player', '' );

	for ( const [ name, value ] of Object.entries( attributes ) ) {
		element.setAttribute( name, value );
	}

	document.body.appendChild( element );
	return element;
}

async function loadWaveformPlayer() {
	return ( await import( '@arraypress/waveform-player' ) ).default;
}

describe( 'Waveform Player dependency', () => {
	let WaveformPlayer;
	let originalReadyState;
	let jsdomStubs;

	beforeEach( () => {
		vi.useFakeTimers();
		originalReadyState = Object.getOwnPropertyDescriptor(
			document,
			'readyState'
		);
		Object.defineProperty( document, 'readyState', {
			configurable: true,
			value: 'complete',
		} );

		jsdomStubs = [
			vi
				.spyOn( window.HTMLCanvasElement.prototype, 'getContext' )
				.mockReturnValue( null ),
			vi
				.spyOn( window.HTMLMediaElement.prototype, 'pause' )
				.mockImplementation( () => {} ),
			vi
				.spyOn( window.HTMLMediaElement.prototype, 'load' )
				.mockImplementation( () => {} ),
		];
	} );

	afterEach( () => {
		WaveformPlayer?.destroyAll();
		jsdomStubs.forEach( ( stub ) => stub.mockRestore() );
		vi.useRealTimers();
		vi.resetModules();
		document.body.innerHTML = '';
		delete window.WaveformPlayer;

		if ( originalReadyState ) {
			Object.defineProperty( document, 'readyState', originalReadyState );
		} else {
			delete document.readyState;
		}
	} );

	it( 'uses the default control icons when declarative icon values are unsupported', async () => {
		const iconValue = `<span ${ FIXTURE_ATTRIBUTE }></span>`;
		const element = createDeclarativePlayer( {
			'data-play-icon': iconValue,
			'data-pause-icon': iconValue,
		} );

		WaveformPlayer = await loadWaveformPlayer();
		WaveformPlayer.init();

		expect(
			element.querySelector( `[${ FIXTURE_ATTRIBUTE }]` )
		).toBeNull();
		expect(
			element.querySelector( '.waveform-icon-play svg' )
		).not.toBeNull();
		expect(
			element.querySelector( '.waveform-icon-pause svg' )
		).not.toBeNull();
	} );

	it( 'supports custom control icons passed to the constructor', async () => {
		const element = document.createElement( 'div' );
		const icon = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'svg'
		);
		icon.setAttribute( FIXTURE_ATTRIBUTE, 'constructor' );
		document.body.appendChild( element );

		WaveformPlayer = await loadWaveformPlayer();
		new WaveformPlayer( element, {
			playIcon: icon.outerHTML,
		} );

		expect(
			element.querySelector( `[${ FIXTURE_ATTRIBUTE }="constructor"]` )
		).not.toBeNull();
	} );

	it( 'initializes declarative players only after an explicit request', async () => {
		const element = createDeclarativePlayer();

		WaveformPlayer = await loadWaveformPlayer();

		expect( element ).not.toHaveAttribute( 'data-waveform-initialized' );
		expect( element ).toBeEmptyDOMElement();

		WaveformPlayer.init();

		expect( element ).toHaveAttribute(
			'data-waveform-initialized',
			'true'
		);
		expect(
			element.querySelector( '.waveform-player-inner' )
		).not.toBeNull();
	} );
} );
