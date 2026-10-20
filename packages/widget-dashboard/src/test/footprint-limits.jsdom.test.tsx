import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

globalThis.wpVitest.mockResizeObserver();

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/glance',
		title: 'Glance',
		renderModule: 'glance-module',
	},
	{
		apiVersion: 1,
		name: 'test/panel',
		title: 'Panel',
		renderModule: 'panel-module',
		footprint: 'panel',
	},
];

// Each module renders its own id, so a tile can be found by its body.
const resolveWidgetModule: ResolveWidgetModule = async ( moduleId ) => ( {
	default: ( () => <p>{ moduleId }</p> ) as ComponentType<
		WidgetRenderProps< unknown >
	>,
} );

const layout: DashboardWidget[] = [
	{ uuid: 'a', type: 'test/glance', placement: { width: 1, height: 1 } },
	{ uuid: 'b', type: 'test/panel', placement: { width: 1, height: 1 } },
];

// jsdom lays nothing out, so the grid root reads this width; its gap falls
// back to 24px. Four columns of 232px: a 440px floor needs two of them, and
// a 360px floor needs two 300px rows.
const CONTAINER_WIDTH = 1000;

beforeEach( () => {
	vi.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockReturnValue(
		{
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			right: CONTAINER_WIDTH,
			bottom: 400,
			width: CONTAINER_WIDTH,
			height: 400,
			toJSON() {},
		} as DOMRect
	);
} );

afterEach( () => {
	vi.restoreAllMocks();
} );

async function renderedSpans(
	moduleId: string
): Promise< { columns: string; rows: string } > {
	const body = await screen.findByText( moduleId );
	// eslint-disable-next-line testing-library/no-node-access
	const tile = body.closest< HTMLElement >( '[style*="grid-column-end"]' );
	return {
		columns: tile?.style.gridColumnEnd ?? '',
		rows: tile?.style.gridRowEnd ?? '',
	};
}

describe( 'footprint floors', () => {
	it( 'renders stored spans bounded by the footprint floor', async () => {
		render(
			<WidgetDashboard
				widgetTypes={ widgetTypes }
				resolveWidgetModule={ resolveWidgetModule }
				layout={ layout }
				onLayoutChange={ () => {} }
				gridSettings={ { model: 'grid', columns: 4, rowHeight: 300 } }
			/>
		);

		expect( await renderedSpans( 'glance-module' ) ).toEqual( {
			columns: 'span 1',
			rows: 'span 1',
		} );
		expect( await renderedSpans( 'panel-module' ) ).toEqual( {
			columns: 'span 2',
			rows: 'span 2',
		} );
	} );
} );
