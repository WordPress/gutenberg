import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettledKey } from '../use-settled-key';

const DELAY = 300;

describe( 'useSettledKey', () => {
	beforeEach( () => {
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	const advance = ( ms: number ) =>
		act( () => {
			vi.advanceTimersByTime( ms );
		} );

	const render = ( key: string | null ) =>
		renderHook(
			( props: { key: string | null } ) =>
				useSettledKey( props.key, DELAY ),
			{ initialProps: { key } }
		);

	it( 'withholds the key until the delay has elapsed', () => {
		const { result } = render( 'a' );

		expect( result.current ).toBeNull();
		advance( DELAY - 1 );
		expect( result.current ).toBeNull();
		advance( 1 );
		expect( result.current ).toBe( 'a' );
	} );

	it( 'never settles a key that changed straight to another one', () => {
		const { result, rerender } = render( 'a' );
		advance( DELAY );
		expect( result.current ).toBe( 'a' );

		// The settled key is the one that timed out, so the new key cannot
		// inherit its readiness the way a boolean flag would.
		rerender( { key: 'b' } );
		expect( result.current ).toBeNull();
		advance( DELAY - 1 );
		expect( result.current ).toBeNull();
		advance( 1 );
		expect( result.current ).toBe( 'b' );
	} );

	it( 'restarts the delay each time the key changes', () => {
		const { result, rerender } = render( 'a' );

		advance( DELAY - 1 );
		rerender( { key: 'b' } );
		advance( DELAY - 1 );
		expect( result.current ).toBeNull();
		advance( 1 );
		expect( result.current ).toBe( 'b' );
	} );

	it( 'settles nothing while the key is null', () => {
		const { result, rerender } = render( null );

		advance( DELAY );
		expect( result.current ).toBeNull();

		rerender( { key: 'a' } );
		advance( DELAY );
		expect( result.current ).toBe( 'a' );

		// Clearing the key drops the settled value immediately.
		rerender( { key: null } );
		expect( result.current ).toBeNull();
	} );
} );
