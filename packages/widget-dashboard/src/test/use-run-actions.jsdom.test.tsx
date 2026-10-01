import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';
import { useRunActions } from '../components/widget-actions/use-run-actions';
import { WidgetDashboard } from '../widget-dashboard';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );
globalThis.wpVitest.mockResizeObserver();

/* The runner reads the dashboard's pending map from its context. */
const wrapper = ( { children }: { children: ReactNode } ) => (
	<WidgetDashboard
		layout={ [] }
		onLayoutChange={ () => {} }
		widgetTypes={ [] }
		resolveWidgetModule={ async () => ( { default: () => null } ) }
	>
		{ children }
	</WidgetDashboard>
);

function exportAction(
	callback: WidgetCallbackAction[ 'callback' ]
): WidgetCallbackAction {
	return { id: 'export', label: 'Export', callback };
}

describe( 'useRunActions', () => {
	it( 'keeps an action pending until its promise settles', async () => {
		let settle = () => {};
		const action = exportAction(
			() =>
				new Promise< void >( ( resolve ) => {
					settle = resolve;
				} )
		);
		const { result } = renderHook( () => useRunActions( 'w1' ), {
			wrapper,
		} );

		let running: Promise< void > | undefined;
		act( () => {
			running = result.current.run( action );
		} );
		expect( result.current.pendingIds.has( 'export' ) ).toBe( true );

		await act( async () => {
			settle();
			await running;
		} );
		expect( result.current.pendingIds.has( 'export' ) ).toBe( false );
	} );

	it( 'never marks pending an action whose callback returns no promise', async () => {
		const callback = vi.fn();
		const pendingCounts: number[] = [];
		const { result } = renderHook(
			() => {
				const runner = useRunActions( 'w1' );
				pendingCounts.push( runner.pendingIds.size );
				return runner;
			},
			{ wrapper }
		);

		await act( () => result.current.run( exportAction( callback ) ) );

		expect( callback ).toHaveBeenCalledTimes( 1 );
		expect( Math.max( ...pendingCounts ) ).toBe( 0 );
	} );

	it( 'ends the pending state when the promise rejects', async () => {
		const action = exportAction( () =>
			Promise.reject( new Error( 'Export failed' ) )
		);
		const { result } = renderHook( () => useRunActions( 'w1' ), {
			wrapper,
		} );

		await act( async () => {
			await result.current.run( action );
		} );

		expect( result.current.pendingIds.has( 'export' ) ).toBe( false );
		expect( console ).toHaveErroredWith(
			'Widget w1 action "export" failed.',
			expect.objectContaining( { message: 'Export failed' } )
		);
	} );

	it( 'logs a callback that throws before returning a promise', async () => {
		const action = exportAction( () => {
			throw new Error( 'Export failed' );
		} );
		const { result } = renderHook( () => useRunActions( 'w1' ), {
			wrapper,
		} );

		await act( async () => {
			await result.current.run( action );
		} );

		expect( result.current.pendingIds.has( 'export' ) ).toBe( false );
		expect( console ).toHaveErroredWith(
			'Widget w1 action "export" failed.',
			expect.objectContaining( { message: 'Export failed' } )
		);
	} );
} );
