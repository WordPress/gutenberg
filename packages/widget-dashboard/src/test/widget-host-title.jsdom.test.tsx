import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { useWidgetHost } from '@wordpress/widget-primitives';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );
globalThis.wpVitest.mockResizeObserver();

/* Names its chart after the title the host gives it. */
function ChartWidget() {
	const { title } = useWidgetHost();

	return (
		<div
			role="img"
			aria-label={ title ? `${ title } chart` : 'Unnamed chart' }
		/>
	);
}

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: ChartWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/sales',
		title: 'Sales by device',
		renderModule: 'chart-module',
	},
	{
		apiVersion: 1,
		name: 'test/visits',
		title: 'Visits',
		renderModule: 'chart-module',
	},
];

const layout: DashboardWidget[] = [
	{
		uuid: 'w1',
		type: 'test/sales',
		attributes: {},
		placement: { width: 1, height: 1 },
	},
	{
		uuid: 'w2',
		type: 'test/visits',
		attributes: {},
		placement: { width: 1, height: 1 },
	},
];

describe( 'widget host title', () => {
	it( 'gives each widget the title of its type', async () => {
		render(
			<WidgetDashboard
				layout={ layout }
				onLayoutChange={ () => {} }
				widgetTypes={ widgetTypes }
				editMode={ false }
				onEditChange={ () => {} }
				resolveWidgetModule={ resolveWidgetModule }
			>
				<WidgetDashboard.Widgets />
			</WidgetDashboard>
		);

		expect(
			await screen.findByRole( 'img', { name: 'Sales by device chart' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'img', { name: 'Visits chart' } )
		).toBeInTheDocument();
	} );
} );
