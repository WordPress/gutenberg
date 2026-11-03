import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToolbarMode } from '../use-toolbar-mode';

describe( 'useToolbarMode', () => {
	it( 'starts out designing', () => {
		const { result } = renderHook( () => useToolbarMode( 'block-1' ) );
		expect( result.current[ 0 ] ).toBe( 'design' );
	} );

	it( 'switches to writing and stays there while the same block is selected', () => {
		const { result, rerender } = renderHook(
			( { clientId } ) => useToolbarMode( clientId ),
			{ initialProps: { clientId: 'block-1' } }
		);

		act( () => result.current[ 1 ]( 'write' ) );
		expect( result.current[ 0 ] ).toBe( 'write' );

		rerender( { clientId: 'block-1' } );
		expect( result.current[ 0 ] ).toBe( 'write' );
	} );

	it( 'goes back to designing when another block is selected', () => {
		const { result, rerender } = renderHook(
			( { clientId } ) => useToolbarMode( clientId ),
			{ initialProps: { clientId: 'block-1' } }
		);

		act( () => result.current[ 1 ]( 'write' ) );
		rerender( { clientId: 'block-2' } );

		expect( result.current[ 0 ] ).toBe( 'design' );
	} );

	it( 'goes back to designing when the selection is cleared', () => {
		const { result, rerender } = renderHook(
			( { clientId }: { clientId?: string } ) =>
				useToolbarMode( clientId ),
			{ initialProps: { clientId: 'block-1' } as { clientId?: string } }
		);

		act( () => result.current[ 1 ]( 'write' ) );
		rerender( { clientId: undefined } );

		expect( result.current[ 0 ] ).toBe( 'design' );
	} );
} );
