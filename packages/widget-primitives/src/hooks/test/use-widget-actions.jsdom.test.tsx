import { describe, expect, it, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useWidgetActions } from '../use-widget-actions';
import { WidgetHostProvider } from '../../widget-host';
import { WidgetActionsCollector } from '../../widget-host/widget-actions-collector';
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

/* Two components of one widget, each calling the hook. */
const csvExport: WidgetRuntimeAction = {
	id: 'export',
	label: 'Export CSV',
	relevance: 'medium',
	href: 'https://example.com/orders.csv',
};

function Caller( { actions }: { actions: WidgetRuntimeAction[] } ) {
	useWidgetActions( actions );
	return null;
}

function Widget( {
	withExport,
	exportAction = csvExport,
}: {
	withExport: boolean;
	exportAction?: WidgetRuntimeAction;
} ) {
	return (
		<>
			<Caller actions={ [ report ] } />
			{ withExport && <Caller actions={ [ exportAction ] } /> }
		</>
	);
}

describe( 'useWidgetActions under WidgetActionsCollector', () => {
	function createCollectingHost() {
		const { declare, wrapper: Host } = createHost();
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<Host>
				<WidgetActionsCollector>{ children }</WidgetActionsCollector>
			</Host>
		);

		return { declare, wrapper };
	}

	it( 'hands the host what every call declares', () => {
		const { declare, wrapper } = createCollectingHost();

		render( <Widget withExport />, { wrapper } );

		const declared = declare.mock.lastCall?.[ 0 ];
		expect( declared ).toHaveLength( 2 );
		expect( declared ).toEqual(
			expect.arrayContaining( [ report, csvExport ] )
		);
	} );

	it( 'keeps the last declaration of an id two calls share', () => {
		const { declare, wrapper } = createCollectingHost();
		const later = { ...report, label: 'View full report' };

		const { rerender } = render( <Widget withExport={ false } />, {
			wrapper,
		} );
		rerender( <Widget withExport exportAction={ later } /> );

		expect( declare ).toHaveBeenLastCalledWith( [ later ] );
	} );

	it( 'withdraws only what the unmounted call declared', () => {
		const { declare, wrapper } = createCollectingHost();

		const { rerender } = render( <Widget withExport />, { wrapper } );
		rerender( <Widget withExport={ false } /> );

		expect( declare ).toHaveBeenLastCalledWith( [ report ] );
	} );
} );
