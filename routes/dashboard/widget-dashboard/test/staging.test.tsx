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
import type { DashboardWidget, WidgetGridSettings } from '../types';

const widgetTypes: WidgetType[] = [];

const initialLayout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
	{ uuid: 'b', type: 'core/test', placement: { width: 1, height: 1 } },
];

interface ProbeApi {
	layout: DashboardWidget[];
	gridSettings: WidgetGridSettings;
	hasUncommittedChanges: boolean;
	editMode: boolean;
	mutate: ( next: DashboardWidget[] ) => void;
	mutateGridSettings: ( next: WidgetGridSettings ) => void;
	commit: ( options?: { exitEditMode?: boolean } ) => void;
	cancel: ( options?: {
		exitEditMode?: boolean;
		revertLayout?: boolean;
	} ) => void;
}

const probeRef: { current: ProbeApi | null } = { current: null };

function Probe() {
	const ctx = useDashboardInternalContext();
	useEffect( () => {
		probeRef.current = {
			layout: ctx.layout,
			gridSettings: ctx.gridSettings,
			hasUncommittedChanges: ctx.hasUncommittedChanges,
			editMode: ctx.editMode,
			mutate: ctx.onLayoutChange,
			mutateGridSettings: ctx.onGridSettingsChange,
			commit: ctx.commit,
			cancel: ctx.cancel,
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
	gridSettings?: WidgetGridSettings;
	onGridSettingsChange?: ( next: WidgetGridSettings ) => void;
}

function Harness( {
	layout,
	onLayoutChange,
	gridSettings,
	onGridSettingsChange,
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( true );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ onLayoutChange }
			gridSettings={ gridSettings }
			onGridSettingsChange={ onGridSettingsChange }
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

	describe( 'grid settings staging', () => {
		const initialSettings: WidgetGridSettings = {
			model: 'grid',
			rowHeight: 200,
		};

		it( 'keeps settings mutations in staging without firing onGridSettingsChange', () => {
			const onLayoutChange = jest.fn();
			const onGridSettingsChange = jest.fn();
			render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
					gridSettings={ initialSettings }
					onGridSettingsChange={ onGridSettingsChange }
				/>
			);

			expect( readProbe().hasUncommittedChanges ).toBe( false );

			act( () => {
				readProbe().mutateGridSettings( {
					...initialSettings,
					rowHeight: 300,
				} );
			} );

			expect( onGridSettingsChange ).not.toHaveBeenCalled();
			expect( readProbe().hasUncommittedChanges ).toBe( true );
			expect( readProbe().gridSettings.rowHeight ).toBe( 300 );
		} );

		it( 'publishes both layout and settings on commit', () => {
			const onLayoutChange = jest.fn();
			const onGridSettingsChange = jest.fn();
			render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
					gridSettings={ initialSettings }
					onGridSettingsChange={ onGridSettingsChange }
				/>
			);

			act( () => {
				readProbe().mutate( [ initialLayout[ 0 ] ] );
				readProbe().mutateGridSettings( {
					...initialSettings,
					model: 'masonry',
				} );
			} );

			act( () => {
				readProbe().commit();
			} );

			expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
			expect( onGridSettingsChange ).toHaveBeenCalledTimes( 1 );
			expect( onGridSettingsChange.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				model: 'masonry',
			} );
		} );

		it( 'reverts settings on cancel', () => {
			const onLayoutChange = jest.fn();
			const onGridSettingsChange = jest.fn();
			render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
					gridSettings={ initialSettings }
					onGridSettingsChange={ onGridSettingsChange }
				/>
			);

			act( () => {
				readProbe().mutateGridSettings( {
					...initialSettings,
					model: 'masonry',
				} );
			} );

			expect( readProbe().hasUncommittedChanges ).toBe( true );

			act( () => {
				readProbe().cancel();
			} );

			expect( onGridSettingsChange ).not.toHaveBeenCalled();
			expect( readProbe().hasUncommittedChanges ).toBe( false );
			expect( readProbe().gridSettings.model ).toBe( 'grid' );
		} );

		it( 'skips publishing settings when only the layout changed', () => {
			const onLayoutChange = jest.fn();
			const onGridSettingsChange = jest.fn();
			render(
				<Harness
					layout={ initialLayout }
					onLayoutChange={ onLayoutChange }
					gridSettings={ initialSettings }
					onGridSettingsChange={ onGridSettingsChange }
				/>
			);

			act( () => {
				readProbe().mutate( [ initialLayout[ 0 ] ] );
			} );

			act( () => {
				readProbe().commit();
			} );

			expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
			expect( onGridSettingsChange ).not.toHaveBeenCalled();
		} );
	} );

	it( 'reverts only grid settings when cancel passes revertLayout: false', () => {
		const onLayoutChange = jest.fn();
		const onGridSettingsChange = jest.fn();
		const initialSettings: WidgetGridSettings = {
			model: 'grid',
			minColumnWidth: 350,
			rowHeight: 200,
		};
		render(
			<Harness
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
				gridSettings={ initialSettings }
				onGridSettingsChange={ onGridSettingsChange }
			/>
		);

		act( () => {
			readProbe().mutate( [ initialLayout[ 0 ] ] );
			readProbe().mutateGridSettings( {
				...initialSettings,
				minColumnWidth: 420,
			} );
		} );

		expect( readProbe().hasUncommittedChanges ).toBe( true );

		act( () => {
			readProbe().cancel( {
				exitEditMode: false,
				revertLayout: false,
			} );
		} );

		expect( readProbe().hasUncommittedChanges ).toBe( true );
		expect( readProbe().layout ).toHaveLength( 1 );
		expect( readProbe().gridSettings.minColumnWidth ).toBe( 350 );
	} );

	it( 'stays in edit mode when commit or cancel passes exitEditMode: false', () => {
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

		act( () => {
			readProbe().mutate( [ initialLayout[ 0 ] ] );
		} );

		act( () => {
			readProbe().cancel( { exitEditMode: false } );
		} );

		expect( readProbe().editMode ).toBe( true );
	} );
} );
