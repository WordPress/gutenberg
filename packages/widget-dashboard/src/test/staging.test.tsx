/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../context/dashboard-context';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

const widgetTypes: WidgetType[] = [];

const initialLayout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
	{ uuid: 'b', type: 'core/test', placement: { width: 1, height: 1 } },
];

interface ProbeApi {
	layout: DashboardWidget[];
	hasUncommittedChanges: boolean;
	editMode: boolean;
	mutate: ( next: DashboardWidget[] ) => void;
	commit: ( options?: { exitEditMode?: boolean } ) => void;
	cancel: () => void;
	scheduleAutoSave: () => void;
	flushAutoSave: () => void;
}

const probeRef: { current: ProbeApi | null } = { current: null };

function Probe() {
	const ctx = useDashboardInternalContext();
	useEffect( () => {
		probeRef.current = {
			layout: ctx.layout,
			hasUncommittedChanges: ctx.hasUncommittedChanges,
			editMode: ctx.editMode,
			mutate: ctx.onLayoutChange,
			commit: ctx.commit,
			cancel: ctx.cancel,
			scheduleAutoSave: ctx.scheduleAutoSave,
			flushAutoSave: ctx.flushAutoSave,
		};
	} );
	return null;
}

function readProbe(): ProbeApi {
	if ( ! probeRef.current ) {
		throw new Error( 'Probe not mounted yet' );
	}
	return probeRef.current;
}

interface HarnessProps {
	layout: DashboardWidget[];
	onLayoutChange: ( next: DashboardWidget[] ) => void;
	initialEditMode?: boolean;
}

function Harness( {
	layout,
	onLayoutChange,
	initialEditMode = true,
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ onLayoutChange }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
		>
			<Probe />
		</WidgetDashboard>
	);
}

describe( 'WidgetDashboard staging layer', () => {
	it( 'keeps mutations in staging without firing onLayoutChange', () => {
		const onLayoutChange = jest.fn();
		render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
			/>
		);

		expect( readProbe().hasUncommittedChanges ).toBe( false );

		const moved: DashboardWidget[] = [
			{ ...initialLayout[ 1 ] },
			{ ...initialLayout[ 0 ] },
		];

		act( () => {
			readProbe().mutate( moved );
		} );

		expect( onLayoutChange ).not.toHaveBeenCalled();
		expect( readProbe().hasUncommittedChanges ).toBe( true );
		expect( readProbe().layout.map( ( w ) => w.uuid ) ).toEqual( [
			'b',
			'a',
		] );
	} );

	it( 'fires onLayoutChange with the staged layout on commit', () => {
		const onLayoutChange = jest.fn();
		render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
			/>
		);

		const next: DashboardWidget[] = [
			...initialLayout,
			{
				uuid: 'c',
				type: 'core/test',
				placement: { width: 1, height: 1 },
			},
		];

		act( () => {
			readProbe().mutate( next );
		} );

		act( () => {
			readProbe().commit();
		} );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		expect(
			onLayoutChange.mock.calls[ 0 ][ 0 ].map(
				( w: DashboardWidget ) => w.uuid
			)
		).toEqual( [ 'a', 'b', 'c' ] );
	} );

	it( 'restores staging to the committed layout on cancel', () => {
		const onLayoutChange = jest.fn();
		render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
			/>
		);

		act( () => {
			readProbe().mutate( [ initialLayout[ 0 ] ] );
		} );

		expect( readProbe().hasUncommittedChanges ).toBe( true );

		act( () => {
			readProbe().cancel();
		} );

		expect( readProbe().hasUncommittedChanges ).toBe( false );
		expect( readProbe().layout.map( ( w ) => w.uuid ) ).toEqual( [
			'a',
			'b',
		] );
		expect( onLayoutChange ).not.toHaveBeenCalled();
	} );

	it( 'reports no uncommitted changes after a swap-and-revert when the visible order is restored', () => {
		const onLayoutChange = jest.fn();
		render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
			/>
		);

		// Initial: committed has no `order`. After a swap, the grid assigns
		// explicit order values. After re-swapping, the visible order
		// matches initial but the array shape carries explicit orders.
		act( () => {
			readProbe().mutate( [
				{
					...initialLayout[ 0 ],
					placement: { width: 1, height: 1, order: 0 },
				},
				{
					...initialLayout[ 1 ],
					placement: { width: 1, height: 1, order: 1 },
				},
			] );
		} );

		expect( readProbe().hasUncommittedChanges ).toBe( false );
	} );

	it( 'commits a canonicalized layout, sorted by order with order stripped', () => {
		const onLayoutChange = jest.fn();
		render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
			/>
		);

		// Stage a layout where the array is in reverse visual order but
		// the placements carry explicit `order` values that restore the
		// visible "a then b" arrangement.
		act( () => {
			readProbe().mutate( [
				{
					...initialLayout[ 1 ],
					placement: { width: 1, height: 1, order: 1 },
				},
				{
					...initialLayout[ 0 ],
					placement: { width: 1, height: 1, order: 0 },
				},
			] );
		} );

		// hasUncommittedChanges should be false (visual order is unchanged).
		expect( readProbe().hasUncommittedChanges ).toBe( false );

		// Now stage a true visual change that also carries `order`, and
		// commit. The publish payload should be sorted by order with the
		// `order` field stripped.
		act( () => {
			readProbe().mutate( [
				{
					...initialLayout[ 0 ],
					placement: { width: 1, height: 1, order: 1 },
				},
				{
					...initialLayout[ 1 ],
					placement: { width: 1, height: 1, order: 0 },
				},
			] );
		} );

		act( () => {
			readProbe().commit();
		} );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const committed = onLayoutChange.mock.calls[ 0 ][ 0 ];
		expect( committed.map( ( w: DashboardWidget ) => w.uuid ) ).toEqual( [
			'b',
			'a',
		] );
		for ( const widget of committed ) {
			expect( widget.placement ).not.toHaveProperty( 'order' );
		}
	} );

	it( 'forces edit mode when the layout becomes empty', () => {
		const onLayoutChange = jest.fn();
		const { rerender } = render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
			/>
		);

		// Empty committed -> auto edit-mode after sync.
		rerender( <Harness layout={ [] } onLayoutChange={ onLayoutChange } /> );

		expect( readProbe().editMode ).toBe( true );
	} );

	it( 'stays in edit mode when commit passes exitEditMode: false', () => {
		const onLayoutChange = jest.fn();
		render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
			/>
		);

		act( () => {
			readProbe().mutate( [ initialLayout[ 0 ] ] );
		} );

		act( () => {
			readProbe().commit( { exitEditMode: false } );
		} );

		expect( readProbe().editMode ).toBe( true );
		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'inline auto-save', () => {
		const moved: DashboardWidget[] = [
			{ ...initialLayout[ 1 ] },
			{ ...initialLayout[ 0 ] },
		];

		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'publishes a scheduled edit once the debounce elapses, staying in normal mode', () => {
			const onLayoutChange = jest.fn();
			render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
					initialEditMode={ false }
				/>
			);

			act( () => {
				readProbe().mutate( moved );
				readProbe().scheduleAutoSave();
			} );

			expect( onLayoutChange ).not.toHaveBeenCalled();

			act( () => {
				jest.runOnlyPendingTimers();
			} );

			expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
			expect(
				onLayoutChange.mock.calls[ 0 ][ 0 ].map(
					( w: DashboardWidget ) => w.uuid
				)
			).toEqual( [ 'b', 'a' ] );
			expect( readProbe().editMode ).toBe( false );
		} );

		it( 'publishes a pending edit immediately on flushAutoSave', () => {
			const onLayoutChange = jest.fn();
			render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
					initialEditMode={ false }
				/>
			);

			act( () => {
				readProbe().mutate( moved );
				readProbe().scheduleAutoSave();
			} );

			act( () => {
				readProbe().flushAutoSave();
			} );

			expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'flushes a pending edit on unmount instead of dropping it', () => {
			const onLayoutChange = jest.fn();
			const { unmount } = render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
					initialEditMode={ false }
				/>
			);

			act( () => {
				readProbe().mutate( moved );
				readProbe().scheduleAutoSave();
			} );

			expect( onLayoutChange ).not.toHaveBeenCalled();

			unmount();

			expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
			expect(
				onLayoutChange.mock.calls[ 0 ][ 0 ].map(
					( w: DashboardWidget ) => w.uuid
				)
			).toEqual( [ 'b', 'a' ] );
		} );

		it( 'does not publish unscheduled staging on unmount', () => {
			const onLayoutChange = jest.fn();
			const { unmount } = render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
				/>
			);

			act( () => {
				readProbe().mutate( moved );
			} );

			unmount();

			expect( onLayoutChange ).not.toHaveBeenCalled();
		} );
	} );
} );
