import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useWidgetActions } from '../use-widget-actions';
import { WidgetHostProvider } from '../../widget-host';
import type { WidgetCallbackAction, WidgetRuntimeAction } from '../../types';

function createHost() {
	const declare = vi.fn< ( actions: WidgetRuntimeAction[] ) => void >();
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<WidgetHostProvider value={ { actions: { declare } } }>
			{ children }
		</WidgetHostProvider>
	);

	return { declare, wrapper };
}

const report: WidgetRuntimeAction = {
	id: 'report',
	label: 'View report',
	relevance: 'high',
	href: 'admin.php?page=reports',
};

describe( 'useWidgetActions', () => {
	it( 'declares the actions on mount and reports the host took them', () => {
		const { declare, wrapper } = createHost();
		const actions = [ report ];

		const { result } = renderHook( () => useWidgetActions( actions ), {
			wrapper,
		} );

		expect( result.current ).toBe( true );
		expect( declare ).toHaveBeenCalledTimes( 1 );
		expect( declare ).toHaveBeenLastCalledWith( actions );
	} );

	it( 'reports no host without the capability', () => {
		const { result } = renderHook( () => useWidgetActions( [ report ] ) );

		expect( result.current ).toBe( false );
	} );

	it( 'declares again only when the list changes by value', () => {
		const { declare, wrapper } = createHost();

		const { rerender } = renderHook(
			( { label } ) => useWidgetActions( [ { ...report, label } ] ),
			{ wrapper, initialProps: { label: 'View report' } }
		);
		rerender( { label: 'View report' } );
		expect( declare ).toHaveBeenCalledTimes( 1 );

		rerender( { label: 'View 3 reports' } );
		expect( declare ).toHaveBeenCalledTimes( 2 );
		expect( declare ).toHaveBeenLastCalledWith( [
			{ ...report, label: 'View 3 reports' },
		] );
	} );

	it( 'runs the latest callback without declaring again', () => {
		const { declare, wrapper } = createHost();
		const first = vi.fn();
		const second = vi.fn();

		const { rerender } = renderHook(
			( { callback } ) =>
				useWidgetActions( [
					{ id: 'export', label: 'Export', callback },
				] ),
			{ wrapper, initialProps: { callback: first } }
		);
		rerender( { callback: second } );
		expect( declare ).toHaveBeenCalledTimes( 1 );

		const [ declared ] = declare.mock.calls[ 0 ][ 0 ];
		( declared as WidgetCallbackAction ).callback();

		expect( first ).not.toHaveBeenCalled();
		expect( second ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'withdraws the actions on unmount', () => {
		const { declare, wrapper } = createHost();

		const { unmount } = renderHook( () => useWidgetActions( [ report ] ), {
			wrapper,
		} );
		unmount();

		expect( declare ).toHaveBeenLastCalledWith( [] );
	} );
} );
