import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createDeclarativePlayer() {
	const element = document.createElement( 'div' );
	element.setAttribute( 'data-waveform-player', '' );
	document.body.appendChild( element );
	return element;
}

async function loadWaveformUtils() {
	await import( '../waveform-utils' );
}

describe( 'Waveform Player dependency', () => {
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
		window.WaveformPlayer?.destroyAll();
		jsdomStubs.forEach( ( stub ) => stub.mockRestore() );
		vi.useRealTimers();
		vi.resetModules();
		document.body.innerHTML = '';

		if ( originalReadyState ) {
			Object.defineProperty( document, 'readyState', originalReadyState );
		} else {
			delete document.readyState;
		}
	} );

	it( 'initializes declarative markup that is requested explicitly', async () => {
		const element = createDeclarativePlayer();

		await loadWaveformUtils();
		window.WaveformPlayer.init( element );

		expect( element ).toHaveAttribute(
			'data-waveform-initialized',
			'true'
		);
		expect(
			element.querySelector( '.waveform-player-inner' )
		).not.toBeNull();
	} );
} );
