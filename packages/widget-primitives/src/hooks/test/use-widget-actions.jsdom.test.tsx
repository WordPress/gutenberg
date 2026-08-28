import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useWidgetActions } from '../use-widget-actions';
import { WidgetHostProvider } from '../../widget-host';
import type { WidgetRuntimeAction } from '../../types';

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

	it( 're-declares when the list changes and not on a re-render', () => {
		const { declare, wrapper } = createHost();
		const first: WidgetRuntimeAction[] = [ report ];
		const second: WidgetRuntimeAction[] = [
			report,
			{ id: 'export', label: 'Export', callback: () => {} },
		];

		const { rerender } = renderHook(
			( { actions } ) => useWidgetActions( actions ),
			{ wrapper, initialProps: { actions: first } }
		);
		rerender( { actions: first } );
		expect( declare ).toHaveBeenCalledTimes( 1 );

		rerender( { actions: second } );
		expect( declare ).toHaveBeenCalledTimes( 2 );
		expect( declare ).toHaveBeenLastCalledWith( second );
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
