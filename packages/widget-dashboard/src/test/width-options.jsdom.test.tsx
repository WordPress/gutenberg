import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from '@wordpress/element';
import type { WidgetType } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../context/dashboard-context';
import { WidgetDashboard } from '../widget-dashboard';
import type {
	DashboardWidget,
	DashboardWidthOption,
	GridTilePlacement,
	WidgetGridSettings,
} from '../types';

const warningMock = vi.hoisted( () => vi.fn() );

vi.mock( import( '@wordpress/warning' ), () => ( {
	default: warningMock,
} ) );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const widgetTypes: WidgetType[] = [];

const initialLayout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
];

const widthOptions: DashboardWidthOption[] = [
	{ value: 1, label: 'Half width' },
	{ value: 'full', label: 'Full width' },
];

interface ProbeApi {
	layout: DashboardWidget[];
	mutate: ( next: DashboardWidget[] ) => void;
	commit: () => void;
}

const probeRef: { current: ProbeApi | null } = { current: null };

function Probe() {
	const ctx = useDashboardInternalContext();
	useEffect( () => {
		probeRef.current = {
			layout: ctx.layout,
			mutate: ctx.onLayoutChange,
			commit: () => ctx.commit(),
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
	layout?: DashboardWidget[];
	onLayoutChange?: ( next: DashboardWidget[] ) => void;
	widthOptions?: readonly DashboardWidthOption[];
	gridSettings?: WidgetGridSettings;
}

function Harness( {
	layout = initialLayout,
	onLayoutChange,
	widthOptions: choices,
	gridSettings,
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( true );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ onLayoutChange ?? ( () => {} ) }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			widthOptions={ choices }
			gridSettings={ gridSettings }
		>
			<Probe />
		</WidgetDashboard>
	);
}

function withWidth( width: Partial< GridTilePlacement >, uuid = 'a' ) {
	return initialLayout.map( ( widget ) =>
		widget.uuid === uuid
			? { ...widget, placement: { ...widget.placement, ...width } }
			: widget
	);
}

function stagedWidth( uuid = 'a' ) {
	return readProbe().layout.find( ( widget ) => widget.uuid === uuid )
		?.placement?.width;
}

describe( 'WidgetDashboard width options', () => {
	it( 'leaves width staging unrestricted when no choices are declared', () => {
		render( <Harness /> );

		act( () => {
			readProbe().mutate( withWidth( { width: 'full' } ) );
		} );

		expect( stagedWidth() ).toBe( 'full' );
	} );

	it( 'stages a declared choice', () => {
		render( <Harness widthOptions={ widthOptions } /> );

		act( () => {
			readProbe().mutate( withWidth( { width: 'full' } ) );
		} );

		expect( stagedWidth() ).toBe( 'full' );
	} );

	it( 'restores the committed width when a staged width is not a choice', () => {
		render( <Harness widthOptions={ widthOptions } /> );

		act( () => {
			readProbe().mutate( withWidth( { width: 3 } ) );
		} );

		expect( stagedWidth() ).toBe( 1 );
	} );

	it( 'keeps an independent height edit when the width is rejected', () => {
		render( <Harness widthOptions={ widthOptions } /> );

		act( () => {
			readProbe().mutate( withWidth( { width: 3, height: 5 } ) );
		} );

		const [ staged ] = readProbe().layout;
		expect( staged.placement?.width ).toBe( 1 );
		expect( ( staged.placement as GridTilePlacement ).height ).toBe( 5 );
	} );

	it( 'keeps a width stored before the choices existed visible', () => {
		const legacy: DashboardWidget[] = [
			{
				uuid: 'a',
				type: 'core/test',
				placement: { width: 4, height: 1 },
			},
		];
		render( <Harness layout={ legacy } widthOptions={ widthOptions } /> );

		act( () => {
			readProbe().mutate( [
				{
					...legacy[ 0 ],
					placement: { ...legacy[ 0 ].placement, height: 3 },
				},
			] );
		} );

		const [ staged ] = readProbe().layout;
		expect( staged.placement?.width ).toBe( 4 );
		expect( ( staged.placement as GridTilePlacement ).height ).toBe( 3 );
	} );

	it( 'accepts an insertion that carries a declared width', () => {
		render( <Harness widthOptions={ widthOptions } /> );

		act( () => {
			readProbe().mutate( [
				...initialLayout,
				{
					uuid: 'new',
					type: 'core/test',
					placement: { width: 'full', height: 1 },
				},
			] );
		} );

		expect( readProbe().layout.map( ( widget ) => widget.uuid ) ).toEqual( [
			'a',
			'new',
		] );
	} );

	it( 'rejects an insertion with no allowed width to restore', () => {
		render( <Harness widthOptions={ widthOptions } /> );

		act( () => {
			readProbe().mutate( [
				...initialLayout,
				{
					uuid: 'unset',
					type: 'core/test',
					placement: { height: 1 },
				},
				{
					uuid: 'unsupported',
					type: 'core/test',
					placement: { width: 3, height: 1 },
				},
			] );
		} );

		expect( readProbe().layout.map( ( widget ) => widget.uuid ) ).toEqual( [
			'a',
		] );
	} );

	it( 'revalidates staging when the choices narrow', () => {
		const { rerender } = render(
			<Harness widthOptions={ widthOptions } />
		);

		act( () => {
			readProbe().mutate( withWidth( { width: 'full' } ) );
		} );
		expect( stagedWidth() ).toBe( 'full' );

		rerender(
			<Harness widthOptions={ [ { value: 1, label: 'Half width' } ] } />
		);

		expect( stagedWidth() ).toBe( 1 );
	} );

	it( 'keeps widths supplied by a controlled reset', () => {
		const { rerender } = render(
			<Harness widthOptions={ widthOptions } />
		);

		const resetLayout: DashboardWidget[] = [
			{
				uuid: 'reset',
				type: 'core/test',
				placement: { width: 4, height: 1 },
			},
		];
		rerender(
			<Harness layout={ resetLayout } widthOptions={ widthOptions } />
		);

		expect( stagedWidth( 'reset' ) ).toBe( 4 );
	} );

	it( 'publishes the restored width, not the staged one, on commit', () => {
		const onLayoutChange = vi.fn();
		const { rerender } = render(
			<Harness
				widthOptions={ widthOptions }
				onLayoutChange={ onLayoutChange }
			/>
		);

		act( () => {
			readProbe().mutate( withWidth( { width: 'full', height: 5 } ) );
		} );

		rerender(
			<Harness
				widthOptions={ [ { value: 1, label: 'Half width' } ] }
				onLayoutChange={ onLayoutChange }
			/>
		);
		act( () => {
			readProbe().commit();
		} );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const [ published ] = onLayoutChange.mock.calls[ 0 ];
		expect( published[ 0 ].placement ).toEqual( { width: 1, height: 5 } );
	} );

	it( 'fails closed for width changes and insertions when the configuration is invalid', () => {
		render( <Harness widthOptions={ [] } /> );

		act( () => {
			readProbe().mutate( withWidth( { width: 'full', height: 4 } ) );
		} );

		const [ staged ] = readProbe().layout;
		expect( staged.placement?.width ).toBe( 1 );
		expect( ( staged.placement as GridTilePlacement ).height ).toBe( 4 );

		act( () => {
			readProbe().mutate( [
				...readProbe().layout,
				{
					uuid: 'new',
					type: 'core/test',
					placement: { width: 1, height: 1 },
				},
			] );
		} );

		expect( readProbe().layout.map( ( widget ) => widget.uuid ) ).toEqual( [
			'a',
		] );
	} );

	it( 'ignores the choices on the masonry model', () => {
		render(
			<Harness
				widthOptions={ [ { value: 1, label: 'Half width' } ] }
				gridSettings={ { model: 'masonry' } }
			/>
		);

		act( () => {
			readProbe().mutate( withWidth( { width: 2 } ) );
		} );

		expect( stagedWidth() ).toBe( 2 );
	} );
} );
