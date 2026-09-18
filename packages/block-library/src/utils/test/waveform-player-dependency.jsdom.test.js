import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const AUTO_INIT_ATTRIBUTE = 'data-waveform-autoinit';

function createDeclarativePlayer() {
	const element = document.createElement( 'div' );
	element.setAttribute( 'data-waveform-player', '' );
	document.body.appendChild( element );
	return element;
}

/**
 * Imports the Playlist utilities, the only module graph that pulls in the
 * waveform player and therefore the only one that can leave the document
 * scanned for declarative markup.
 */
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
		vi.doUnmock( '@arraypress/waveform-player' );
		document.body.innerHTML = '';
		document.documentElement.removeAttribute( AUTO_INIT_ATTRIBUTE );

		if ( originalReadyState ) {
			Object.defineProperty( document, 'readyState', originalReadyState );
		} else {
			delete document.readyState;
		}
	} );

	/*
	 * Must run first: the dependency scans the document while its own module is
	 * evaluated, and `vi.resetModules()` does not re-evaluate dependencies, so
	 * the real scan is only observable on the first import in this file. The
	 * opt-out itself is covered order-independently below.
	 */
	it( 'leaves declarative markup it does not own uninitialized', async () => {
		const element = createDeclarativePlayer();

		await loadWaveformUtils();

		expect( element ).not.toHaveAttribute( 'data-waveform-initialized' );
		expect( element ).toBeEmptyDOMElement();
		expect( document.documentElement ).not.toHaveAttribute(
			AUTO_INIT_ATTRIBUTE
		);
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

	it( 'applies the opt-out before the dependency is evaluated', async () => {
		let attributeWhenEvaluated;

		vi.doMock( '@arraypress/waveform-player', () => {
			attributeWhenEvaluated =
				document.documentElement.getAttribute( AUTO_INIT_ATTRIBUTE );
			return { default: class WaveformPlayerStub {} };
		} );

		await loadWaveformUtils();

		expect( attributeWhenEvaluated ).toBe( 'false' );
	} );

	it( "restores the document's own opt-out value", async () => {
		document.documentElement.setAttribute( AUTO_INIT_ATTRIBUTE, 'true' );

		await loadWaveformUtils();

		expect( document.documentElement ).toHaveAttribute(
			AUTO_INIT_ATTRIBUTE,
			'true'
		);
	} );
} );
