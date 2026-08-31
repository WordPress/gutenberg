import { render, screen } from '@testing-library/react';
import type { WidgetType } from '@wordpress/widget-primitives';
import { WidgetHeader } from '../components/widget-header';

const widgetType = {
	apiVersion: 1,
	name: 'test/traffic',
	title: 'Traffic Snapshot Against the Quarterly Revenue Target',
	renderModule: 'test-traffic',
} as WidgetType;

describe( 'WidgetHeader title', () => {
	it( 'carries the full title, which the row may clip', () => {
		render( <WidgetHeader widgetType={ widgetType } showIdentity /> );

		expect(
			screen.getByRole( 'heading', { name: widgetType.title } )
		).toHaveAttribute( 'title', widgetType.title );
	} );
} );
