import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, WidgetGridSettings } from '../types';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

globalThis.wpVitest.mockResizeObserver();

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

// jsdom lays nothing out, so the grid root reads this width; its column gap
// falls back to 24px.
const CONTAINER_WIDTH = 500;

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

async function renderedColumns(
	gridSettings: WidgetGridSettings
): Promise< string > {
	const { container } = render(
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			resolveWidgetModule={ resolveWidgetModule }
			layout={ layout }
			onLayoutChange={ () => {} }
			gridSettings={ gridSettings }
		/>
	);
	// The tile module resolves asynchronously; settle it before reading.
	await screen.findByText( 'Tile body' );
	/* eslint-disable testing-library/no-container, testing-library/no-node-access */
	const grid = container.querySelector< HTMLElement >(
		'[style*="grid-auto-rows"]'
	);
	/* eslint-enable testing-library/no-container, testing-library/no-node-access */
	return grid?.style.gridTemplateColumns ?? '';
}

describe( 'column count', () => {
	it( 'renders the package steps when the host sets no policy', async () => {
		// The default steps give one column under 600px.
		expect(
			await renderedColumns( { model: 'grid', rowHeight: 200 } )
		).toBe( 'repeat(1, minmax(0, 1fr))' );
	} );

	it( 'renders a plain count at any width', async () => {
		expect(
			await renderedColumns( {
				model: 'grid',
				columns: 3,
				rowHeight: 200,
			} )
		).toBe( 'repeat(3, minmax(0, 1fr))' );
	} );

	it( 'steps the count by container width', async () => {
		expect(
			await renderedColumns( {
				model: 'grid',
				columns: { 0: 1, 480: 2, 960: 4 },
				rowHeight: 200,
			} )
		).toBe( 'repeat(2, minmax(0, 1fr))' );
	} );

	it( 'lowers a count with a per-column floor', async () => {
		// Three 200px columns need 648px; two fit in 500px.
		expect(
			await renderedColumns( {
				model: 'grid',
				columns: 3,
				minColumnWidth: 200,
				rowHeight: 200,
			} )
		).toBe( 'repeat(2, minmax(0, 1fr))' );
	} );

	it( 'leaves the count to the floor when the host sets no count', async () => {
		// Five 80px columns fit in 500px with a 24px gap: more than the
		// package default of four, so no count was injected.
		expect(
			await renderedColumns( {
				model: 'grid',
				minColumnWidth: 80,
				rowHeight: 200,
			} )
		).toBe( 'repeat(5, minmax(0, 1fr))' );
	} );

	it( 'leaves the count to the floor on an auto step', async () => {
		expect(
			await renderedColumns( {
				model: 'grid',
				columns: { 0: 1, 480: 'auto' },
				minColumnWidth: 80,
				rowHeight: 200,
			} )
		).toBe( 'repeat(5, minmax(0, 1fr))' );
	} );

	it( 'treats a non-positive floor as unset', async () => {
		expect(
			await renderedColumns( {
				model: 'grid',
				columns: 3,
				minColumnWidth: -1,
				rowHeight: 200,
			} )
		).toBe( 'repeat(3, minmax(0, 1fr))' );
	} );
} );
