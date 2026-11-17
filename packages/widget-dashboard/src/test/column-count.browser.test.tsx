import type { ComponentType } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { useLayoutEffect, useRef } from '@wordpress/element';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, WidgetGridSettings } from '../types';

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/tile',
		title: 'Tile',
		renderModule: 'test-tile-module',
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: ( () => <p>Tile body</p> ) as ComponentType<
		WidgetRenderProps< unknown >
	>,
} );

const layout: DashboardWidget[] = [
	{ uuid: 'a', type: 'test/tile', placement: { width: 1, height: 1 } },
];

// The surface measures this width through its ResizeObserver; its column gap
// resolves to 24px.
const CONTAINER_WIDTH = 500;

/**
 * Mounts the dashboard in a fixed-width container and returns a reader of
 * the column count the surface rendered, parsed from its track template.
 * The observer delivers the measured width after the first paint, so the
 * reader is meant for `waitFor`.
 *
 * @param gridSettings Grid settings under test.
 * @return Reader of the rendered column count.
 */
async function renderDashboard(
	gridSettings: WidgetGridSettings
): Promise< () => number | undefined > {
	const { container } = await render(
		<div style={ { width: CONTAINER_WIDTH } }>
			<WidgetDashboard
				widgetTypes={ widgetTypes }
				resolveWidgetModule={ resolveWidgetModule }
				layout={ layout }
				onLayoutChange={ () => {} }
				gridSettings={ gridSettings }
			/>
		</div>
	);
	// The tile module resolves asynchronously; settle it before reading.
	await screen.findByText( 'Tile body' );
	return () => {
		// eslint-disable-next-line testing-library/no-node-access
		const grid = container.querySelector< HTMLElement >(
			'[style*="grid-auto-rows"]'
		);
		const match = /^repeat\((\d+), /.exec(
			grid?.style.gridTemplateColumns ?? ''
		);
		return match ? Number( match[ 1 ] ) : undefined;
	};
}

describe( 'column count', () => {
	it( 'renders the package steps when the host sets no policy', async () => {
		// The default steps give one column under 600px.
		const columns = await renderDashboard( {
			model: 'grid',
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 1 ) );
	} );

	it( 'renders a plain count at any width', async () => {
		const columns = await renderDashboard( {
			model: 'grid',
			columns: 3,
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 3 ) );
	} );

	it( 'steps the count by container width', async () => {
		const columns = await renderDashboard( {
			model: 'grid',
			columns: { 0: 1, 480: 2, 960: 4 },
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 2 ) );
	} );

	it( 'lowers a count with a per-column floor', async () => {
		// Three 200px columns need 648px; two fit in 500px.
		const columns = await renderDashboard( {
			model: 'grid',
			columns: 3,
			minColumnWidth: 200,
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 2 ) );
	} );

	it( 'leaves the count to the floor when the host sets no count', async () => {
		// Five 80px columns fit in 500px with a 24px gap: more than the
		// package default of four, so no count was injected.
		const columns = await renderDashboard( {
			model: 'grid',
			minColumnWidth: 80,
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 5 ) );
	} );

	it( 'leaves the count to the floor on an auto step', async () => {
		const columns = await renderDashboard( {
			model: 'grid',
			columns: { 0: 1, 480: 'auto' },
			minColumnWidth: 80,
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 5 ) );
	} );

	it( 'keeps the count below an auto step when no floor is set', async () => {
		const columns = await renderDashboard( {
			model: 'grid',
			columns: { 0: 1, 480: 'auto' },
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 1 ) );
	} );

	it( 'renders the package steps when only auto steps are set', async () => {
		// With no floor the step cannot apply, so no count reaches the
		// surface: the package steps fill in, not the surface's own default.
		const columns = await renderDashboard( {
			model: 'grid',
			columns: { 0: 'auto' },
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 1 ) );
	} );

	it( 'treats a non-positive floor as unset', async () => {
		const columns = await renderDashboard( {
			model: 'grid',
			columns: 3,
			minColumnWidth: -1,
			rowHeight: 200,
		} );
		await waitFor( () => expect( columns() ).toBe( 3 ) );
	} );
} );

interface MountReading {
	span: string;
	width: number;
}

// What each probe read from its tile in its first layout effect, by tile key.
const mountReadings = new Map< string, MountReading >();

function readTile( tile: HTMLElement ): MountReading {
	return {
		span: window.getComputedStyle( tile ).gridColumnEnd,
		width: tile.getBoundingClientRect().width,
	};
}

/**
 * Widget body that reads its tile's span and width when it first mounts,
 * as a widget that picks its layout from its own size does.
 */
function MountProbe() {
	const ref = useRef< HTMLParagraphElement >( null );
	useLayoutEffect( () => {
		// eslint-disable-next-line testing-library/no-node-access
		const tile = ref.current?.closest< HTMLElement >(
			'[data-wp-grid-item-key]'
		);
		const key = tile?.getAttribute( 'data-wp-grid-item-key' );
		if ( tile && key && ! mountReadings.has( key ) ) {
			mountReadings.set( key, readTile( tile ) );
		}
	}, [] );
	return <p ref={ ref }>Probe body</p>;
}

const probeWidgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/probe',
		title: 'Probe',
		renderModule: 'test-probe-module',
	},
];

const resolveProbeModule: ResolveWidgetModule = async () => ( {
	default: MountProbe as ComponentType< WidgetRenderProps< unknown > >,
} );

describe( 'first render', () => {
	// Wide enough for the 960px step, so the surface settles on three
	// columns; a one-column first render would show as `span 1` on the wide
	// tile and full width on the narrow one.
	const STEPPED_WIDTH = 1000;

	async function mountProbes(
		gridSettings: WidgetGridSettings,
		probeLayout: DashboardWidget[]
	) {
		const ui = (
			<div style={ { width: STEPPED_WIDTH } }>
				<WidgetDashboard
					widgetTypes={ probeWidgetTypes }
					resolveWidgetModule={ resolveProbeModule }
					layout={ probeLayout }
					onLayoutChange={ () => {} }
					gridSettings={ gridSettings }
				/>
			</div>
		);
		// The first mount resolves the module; the remount renders the
		// widgets from the module cache in the same commit as their tiles,
		// as a host does when it switches back to a dashboard.
		const first = await render( ui );
		await screen.findAllByText( 'Probe body' );
		await first.unmount();
		mountReadings.clear();
		const { container } = await render( ui );
		await screen.findAllByText( 'Probe body' );
		return ( key: string ) => {
			// eslint-disable-next-line testing-library/no-node-access
			const tile = container.querySelector< HTMLElement >(
				`[data-wp-grid-item-key="${ key }"]`
			);
			if ( ! tile ) {
				throw new Error( `No tile for ${ key }.` );
			}
			return {
				atMount: mountReadings.get( key ),
				settled: readTile( tile ),
			};
		};
	}

	it( 'gives grid tiles their resolved span when they mount', async () => {
		const read = await mountProbes(
			{ model: 'grid', columns: { 0: 1, 960: 3 }, rowHeight: 200 },
			[
				{ uuid: 'wide', type: 'test/probe', placement: { width: 3 } },
				{ uuid: 'narrow', type: 'test/probe', placement: { width: 1 } },
			]
		);
		const wide = read( 'wide' );
		const narrow = read( 'narrow' );
		expect( wide.settled.span ).toBe( 'span 3' );
		expect( wide.atMount ).toEqual( wide.settled );
		expect( narrow.settled.width ).toBeLessThan( STEPPED_WIDTH / 2 );
		expect( narrow.atMount ).toEqual( narrow.settled );
	} );

	it( 'gives masonry tiles their resolved width when they mount', async () => {
		const read = await mountProbes(
			{ model: 'masonry', columns: { 0: 1, 960: 3 } },
			[ { uuid: 'narrow', type: 'test/probe', placement: { width: 1 } } ]
		);
		// Only the width: the lane polyfill places tiles in rows after it
		// measures their heights, so their grid lines change after mount.
		const narrow = read( 'narrow' );
		expect( narrow.settled.width ).toBeLessThan( STEPPED_WIDTH / 2 );
		expect( narrow.atMount?.width ).toBe( narrow.settled.width );
	} );
} );
