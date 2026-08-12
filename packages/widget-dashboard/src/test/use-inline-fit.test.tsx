import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useInlineFit } from '../components/widget-attributes/use-inline-fit';
import { WidgetHeaderAvailableSizeProvider } from '../components/widget-header/widget-header-fit';

let notifyResize: ( entries: unknown[] ) => void = () => {};

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver: ( callback: ( entries: unknown[] ) => void ) => {
		notifyResize = callback;
		return () => {};
	},
} ) );

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
	it( 'collapses when the fields exceed the budget and expands back', () => {
		availableSize = 200;
		const { result, rerender } = renderHook(
			( { locked }: { locked: boolean } ) => useInlineFit( { locked } ),
			{ wrapper, initialProps: { locked: false } }
		);

		measureFields( 100 );
		expect( result.current.collapsed ).toBe( false );

		availableSize = 80;
		rerender( { locked: false } );
		expect( result.current.collapsed ).toBe( true );

		availableSize = 200;
		rerender( { locked: false } );
		expect( result.current.collapsed ).toBe( false );
	} );

	it( 'holds the inline presentation while locked', () => {
		availableSize = 200;
		const { result, rerender } = renderHook(
			( { locked }: { locked: boolean } ) => useInlineFit( { locked } ),
			{ wrapper, initialProps: { locked: false } }
		);

		measureFields( 100 );
		expect( result.current.collapsed ).toBe( false );

		// The user starts interacting; space shrinks meanwhile.
		rerender( { locked: true } );
		availableSize = 80;
		rerender( { locked: true } );
		expect( result.current.collapsed ).toBe( false );

		// The interaction ends: the pending transition applies.
		rerender( { locked: false } );
		expect( result.current.collapsed ).toBe( true );
	} );

	it( 'holds the collapsed presentation while locked', () => {
		availableSize = 80;
		const { result, rerender } = renderHook(
			( { locked }: { locked: boolean } ) => useInlineFit( { locked } ),
			{ wrapper, initialProps: { locked: false } }
		);

		measureFields( 100 );
		expect( result.current.collapsed ).toBe( true );

		// The user opens the dropdown; space grows meanwhile.
		rerender( { locked: true } );
		availableSize = 200;
		rerender( { locked: true } );
		expect( result.current.collapsed ).toBe( true );

		// The dropdown closes: the pending transition applies.
		rerender( { locked: false } );
		expect( result.current.collapsed ).toBe( false );
	} );
} );
