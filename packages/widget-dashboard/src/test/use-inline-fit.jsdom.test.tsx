import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useInlineFit } from '../components/widget-attributes/use-inline-fit';
import { WidgetHeaderAvailableSizeProvider } from '../components/widget-header/widget-header-fit';

// The hook observes two elements per render, in order: the inline
// controls, then the select. The latest callback of each is kept.
type Notify = ( entries: unknown[] ) => void;
const mockObservers: Notify[] = [];

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useResizeObserver: ( ( callback: Notify ) => {
		mockObservers.push( callback );
		return () => {};
	} ) as typeof import( '@wordpress/compose' ).useResizeObserver,
} ) );

const notifyResize: Notify = ( entries ) =>
	mockObservers[ mockObservers.length - 2 ]( entries );
const notifySelectResize: Notify = ( entries ) =>
	mockObservers[ mockObservers.length - 1 ]( entries );

function measureSelect( width: number ) {
	act( () => notifySelectResize( [ { contentRect: { width } } ] ) );
}

let availableSize: number | null = null;

function wrapper( { children }: { children: ReactNode } ) {
	return (
		<WidgetHeaderAvailableSizeProvider value={ availableSize }>
			{ children }
		</WidgetHeaderAvailableSizeProvider>
	);
}

function measureFields( width: number ) {
	act( () => notifyResize( [ { contentRect: { width } } ] ) );
}

describe( 'useInlineFit', () => {
	it( 'keeps inline controls at an exact fit and requires spare space to expand', () => {
		availableSize = 100;
		const { result, rerender } = renderHook( () => useInlineFit(), {
			wrapper,
		} );

		measureFields( 100 );
		expect( result.current.presentation ).toBe( 'inline' );

		availableSize = 99;
		rerender();
		expect( result.current.presentation ).toBe( 'dropdown' );

		for ( const width of [ 100, 115, 99, 115 ] ) {
			availableSize = width;
			rerender();
			expect( result.current.presentation ).toBe( 'dropdown' );
		}

		availableSize = 116;
		rerender();
		expect( result.current.presentation ).toBe( 'inline' );

		availableSize = 100;
		rerender();
		expect( result.current.presentation ).toBe( 'inline' );
	} );

	it( 'collapses when the fields exceed the budget and expands back', () => {
		availableSize = 200;
		const { result, rerender } = renderHook(
			( { locked }: { locked: boolean } ) => useInlineFit( { locked } ),
			{ wrapper, initialProps: { locked: false } }
		);

		measureFields( 100 );
		expect( result.current.presentation ).toBe( 'inline' );

		availableSize = 80;
		rerender( { locked: false } );
		expect( result.current.presentation ).toBe( 'dropdown' );

		availableSize = 200;
		rerender( { locked: false } );
		expect( result.current.presentation ).toBe( 'inline' );
	} );

	it( 'collapses while locked once the inline controls stop fitting', () => {
		availableSize = 200;
		const { result, rerender } = renderHook(
			( { locked }: { locked: boolean } ) => useInlineFit( { locked } ),
			{ wrapper, initialProps: { locked: false } }
		);

		measureFields( 100 );
		expect( result.current.presentation ).toBe( 'inline' );

		// The user starts interacting; space shrinks meanwhile. Holding the
		// inline controls would clip them, so they collapse at once.
		rerender( { locked: true } );
		availableSize = 80;
		rerender( { locked: true } );
		expect( result.current.presentation ).toBe( 'dropdown' );

		// The lock now holds the collapse, even with room to expand.
		availableSize = 200;
		rerender( { locked: true } );
		expect( result.current.presentation ).toBe( 'dropdown' );

		rerender( { locked: false } );
		expect( result.current.presentation ).toBe( 'inline' );
	} );

	it( 'holds the collapsed presentation while locked', () => {
		availableSize = 80;
		const { result, rerender } = renderHook(
			( { locked }: { locked: boolean } ) => useInlineFit( { locked } ),
			{ wrapper, initialProps: { locked: false } }
		);

		measureFields( 100 );
		expect( result.current.presentation ).toBe( 'dropdown' );

		// The user opens the dropdown; space grows meanwhile.
		rerender( { locked: true } );
		availableSize = 115;
		rerender( { locked: true } );
		expect( result.current.presentation ).toBe( 'dropdown' );

		// Closing inside the buffer keeps the controls collapsed.
		rerender( { locked: false } );
		expect( result.current.presentation ).toBe( 'dropdown' );

		rerender( { locked: true } );
		availableSize = 116;
		rerender( { locked: true } );
		expect( result.current.presentation ).toBe( 'dropdown' );

		// The dropdown closes: the pending transition applies.
		rerender( { locked: false } );
		expect( result.current.presentation ).toBe( 'inline' );
	} );

	it( 'steps through the select, at the same widths in both directions', () => {
		availableSize = 200;
		const { result, rerender } = renderHook(
			() => useInlineFit( { canSelect: true } ),
			{ wrapper }
		);

		// Inline 150 wide; the select, once measured, 90.
		measureFields( 150 );
		expect( result.current.presentation ).toBe( 'inline' );

		// An unmeasured select is tried first, so it can be measured.
		availableSize = 149;
		rerender();
		expect( result.current.presentation ).toBe( 'select' );
		measureSelect( 90 );

		const sweep = ( widths: number[] ) =>
			widths.map( ( width ) => {
				availableSize = width;
				rerender();
				return result.current.presentation;
			} );

		// Shrinking: the select holds down to its own width, then steps on.
		expect( sweep( [ 120, 90, 89 ] ) ).toEqual( [
			'select',
			'select',
			'dropdown',
		] );

		// Growing: each step needs its width plus the buffer.
		expect( sweep( [ 105, 106, 165, 166 ] ) ).toEqual( [
			'dropdown',
			'select',
			'select',
			'inline',
		] );

		// Shrinking again collapses at the same widths as the first time.
		expect( sweep( [ 150, 149, 90, 89 ] ) ).toEqual( [
			'inline',
			'select',
			'select',
			'dropdown',
		] );
	} );

	it( 'skips the select when it is no narrower than the budget', () => {
		availableSize = 200;
		const { result, rerender } = renderHook(
			() => useInlineFit( { canSelect: true } ),
			{ wrapper }
		);

		measureFields( 150 );
		availableSize = 140;
		rerender();
		measureSelect( 160 );
		expect( result.current.presentation ).toBe( 'dropdown' );
	} );

	it( 'goes straight to the dropdown without the select step', () => {
		availableSize = 200;
		const { result, rerender } = renderHook( () => useInlineFit(), {
			wrapper,
		} );

		measureFields( 150 );
		availableSize = 149;
		rerender();
		expect( result.current.presentation ).toBe( 'dropdown' );
	} );

	it( 'holds a locked select, but still steps down from it', () => {
		availableSize = 120;
		const { result, rerender } = renderHook(
			( { locked }: { locked: boolean } ) =>
				useInlineFit( { canSelect: true, locked } ),
			{ wrapper, initialProps: { locked: false } }
		);

		measureFields( 150 );
		measureSelect( 90 );
		expect( result.current.presentation ).toBe( 'select' );

		// Focused select, room to expand: held.
		availableSize = 400;
		rerender( { locked: true } );
		expect( result.current.presentation ).toBe( 'select' );

		// Focused select that no longer fits: it collapses anyway.
		availableSize = 80;
		rerender( { locked: true } );
		expect( result.current.presentation ).toBe( 'dropdown' );

		// The dropdown is held from expanding back to the select.
		availableSize = 120;
		rerender( { locked: true } );
		expect( result.current.presentation ).toBe( 'dropdown' );
		rerender( { locked: false } );
		expect( result.current.presentation ).toBe( 'select' );
	} );
} );
