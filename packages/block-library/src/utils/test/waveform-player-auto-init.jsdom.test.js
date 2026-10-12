import { afterEach, describe, expect, it, vi } from 'vitest';

/*
 * Kept in a file of its own: the dependency is evaluated once per file and CI
 * shuffles test order, so any sibling test importing it first would leave this
 * one asserting an already scanned document.
 */
describe( 'Waveform Player auto-initialization', () => {
	afterEach( () => {
		vi.resetModules();
		document.body.innerHTML = '';
		delete window.WaveformPlayer;
	} );

	it( 'leaves declarative markup it does not own uninitialized', async () => {
		const element = document.createElement( 'div' );
		element.setAttribute( 'data-waveform-player', '' );
		document.body.appendChild( element );

		await import( '../waveform-utils' );

		expect( element ).not.toHaveAttribute( 'data-waveform-initialized' );
		expect( element ).toBeEmptyDOMElement();
	} );
} );
