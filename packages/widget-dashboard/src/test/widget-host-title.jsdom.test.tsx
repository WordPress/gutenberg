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

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );
globalThis.wpVitest.mockResizeObserver();

function ChartWidget() {
	const { title } = useWidgetHost();

	return <figure aria-label={ `Chart: ${ title }` } />;
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/sales',
		title: 'Sales by device',
		renderModule: 'sales-module',
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: ChartWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

describe( 'widget host title', () => {
	it( 'gives the widget its type title', async () => {
		render(
			<WidgetDashboard
				layout={ [
					{
						uuid: 'w1',
						type: 'test/sales',
						attributes: {},
						placement: { width: 1, height: 1 },
					},
				] }
				onLayoutChange={ () => {} }
				widgetTypes={ widgetTypes }
				resolveWidgetModule={ resolveWidgetModule }
			>
				<WidgetDashboard.Widgets />
			</WidgetDashboard>
		);

		expect(
			await screen.findByRole( 'figure', {
				name: 'Chart: Sales by device',
			} )
		).toBeInTheDocument();
	} );
} );
