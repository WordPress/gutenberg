import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';
import { useRunActions } from '../components/widget-actions/use-run-actions';

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
		const { result } = renderHook( () => useRunActions() );

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
		const { result } = renderHook( () => {
			const runner = useRunActions();
			pendingCounts.push( runner.pendingIds.size );
			return runner;
		} );

		await act( () => result.current.run( exportAction( callback ) ) );

		expect( callback ).toHaveBeenCalledTimes( 1 );
		expect( Math.max( ...pendingCounts ) ).toBe( 0 );
	} );

	it( 'ends the pending state when the promise rejects', async () => {
		const action = exportAction( () =>
			Promise.reject( new Error( 'Export failed' ) )
		);
		const { result } = renderHook( () => useRunActions() );

		await act( async () => {
			await expect( result.current.run( action ) ).rejects.toThrow(
				'Export failed'
			);
		} );

		expect( result.current.pendingIds.has( 'export' ) ).toBe( false );
	} );
} );
