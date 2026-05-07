/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../context/dashboard-context';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, WidgetType } from '../types';

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
	commit: () => void;
	cancel: () => void;
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
			commit: ctx.commitLayout,
			cancel: ctx.cancelLayout,
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
}

function Harness( { layout, onLayoutChange }: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( true );

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
} );
