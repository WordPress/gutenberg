import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRecentlyTyped } from '../use-recently-typed';

const DELAY_MS = 1000;

function pressKey( target: Document, key = 'a' ) {
	act( () => {
		target.dispatchEvent(
			new window.KeyboardEvent( 'keydown', {
				key,
				bubbles: true,
			} )
		);
	} );
}

function advance( ms: number ) {
	act( () => {
		vi.advanceTimersByTime( ms );
	} );
}

describe( 'useRecentlyTyped', () => {
	beforeEach( () => {
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'is false before anything is typed', () => {
		const { result } = renderHook( () =>
			useRecentlyTyped( document, DELAY_MS )
		);

		expect( result.current ).toBe( false );
	} );

	it( 'becomes true on a keystroke and lapses after the delay', () => {
		const { result } = renderHook( () =>
			useRecentlyTyped( document, DELAY_MS )
		);

		pressKey( document );
		expect( result.current ).toBe( true );

		advance( DELAY_MS - 1 );
		expect( result.current ).toBe( true );

		advance( 1 );
		expect( result.current ).toBe( false );
	} );

	it( 'stays true while keystrokes keep arriving', () => {
		const { result } = renderHook( () =>
			useRecentlyTyped( document, DELAY_MS )
		);

		// Each keystroke lands before the previous delay would have elapsed,
		// so the signal should never lapse mid-sentence.
		for ( let i = 0; i < 5; i++ ) {
			pressKey( document );
			advance( DELAY_MS - 100 );
			expect( result.current ).toBe( true );
		}

		advance( 100 );
		expect( result.current ).toBe( false );
	} );

	it( 'ignores modifier keys pressed on their own', () => {
		const { result } = renderHook( () =>
			useRecentlyTyped( document, DELAY_MS )
		);

		for ( const key of [ 'Shift', 'Control', 'Alt', 'Meta' ] ) {
			pressKey( document, key );
		}

		expect( result.current ).toBe( false );
	} );

	it( 'ignores keystrokes in a document it is not watching', () => {
		const otherDocument =
			document.implementation.createHTMLDocument( 'other' );
		const { result } = renderHook( () =>
			useRecentlyTyped( document, DELAY_MS )
		);

		pressKey( otherDocument );

		expect( result.current ).toBe( false );
	} );

	it( 'does nothing without a document', () => {
		const { result } = renderHook( () =>
			useRecentlyTyped( null, DELAY_MS )
		);

		pressKey( document );

		expect( result.current ).toBe( false );
	} );

	it( 'resets when the watched document is replaced', () => {
		const { result, rerender } = renderHook(
			( { doc }: { doc: Document } ) => useRecentlyTyped( doc, DELAY_MS ),
			{ initialProps: { doc: document } }
		);

		pressKey( document );
		expect( result.current ).toBe( true );

		// Switching canvas documents, as a device preview change would.
		const nextDocument =
			document.implementation.createHTMLDocument( 'next' );
		rerender( { doc: nextDocument } );

		expect( result.current ).toBe( false );
	} );

	it( 'stops listening once unmounted', () => {
		const { result, unmount } = renderHook( () =>
			useRecentlyTyped( document, DELAY_MS )
		);

		pressKey( document );
		expect( result.current ).toBe( true );

		const removeSpy = vi.spyOn( document, 'removeEventListener' );

		unmount();

		expect( removeSpy ).toHaveBeenCalledWith(
			'keydown',
			expect.any( Function ),
			true
		);
	} );
} );
