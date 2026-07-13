/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useInlineControlsFit } from '../components/widget-attribute-controls/use-inline-controls-fit';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

jest.mock(
	'../components/widget-attribute-controls/use-inline-controls-fit',
	() => ( {
		useInlineControlsFit: jest.fn(),
	} )
);

const mockedUseInlineControlsFit = jest.mocked( useInlineControlsFit );

function TestWidget( {
	attributes,
}: WidgetRenderProps< { metric?: string } > ) {
	return <p data-testid="metric">{ attributes?.metric ?? '' }</p>;
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/snapshot',
		title: 'Snapshot',
		renderModule: 'snapshot-module',
		attributes: [
			{
				id: 'metric',
				label: 'Metric',
				type: 'text',
				elements: [
					{ value: 'views', label: 'Views' },
					{ value: 'orders', label: 'Orders' },
				],
				relevance: 'high',
			},
			{
				id: 'period',
				label: 'Period',
				type: 'text',
				elements: [
					{ value: 'day', label: 'Day' },
					{ value: 'week', label: 'Week' },
				],
				relevance: 'high',
			},
			{ id: 'label', label: 'Label', type: 'text' },
		],
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: TestWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

const initialLayout: DashboardWidget[] = [
	{
		uuid: 'w1',
		type: 'test/snapshot',
		attributes: { metric: 'views', period: 'day', label: 'Traffic' },
		placement: { width: 1, height: 1 },
	},
];

function Harness() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ setLayout }
			widgetTypes={ widgetTypes }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}

describe( 'WidgetAttributeControls fit', () => {
	beforeEach( () => {
		mockedUseInlineControlsFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: false,
		} );
	} );

	it( 'keeps the inline controls while the header fits', async () => {
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		// While everything fits, the settings trigger opens the settings
		// surface directly.
		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);

		expect(
			await screen.findByRole( 'dialog', { name: 'Snapshot settings' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'dialog', { name: 'Widget settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'collapses behind the settings trigger when space runs out', async () => {
		mockedUseInlineControlsFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Widget settings',
		} );

		// The high-relevance fields render as a labeled form…
		expect(
			within( dialog ).getByRole( 'combobox', { name: 'Metric' } )
		).toBeInTheDocument();
		expect(
			within( dialog ).getByRole( 'combobox', { name: 'Period' } )
		).toBeInTheDocument();
		// …the low-relevance one stays on the settings surface.
		expect(
			within( dialog ).queryByLabelText( 'Label' )
		).not.toBeInTheDocument();
	} );

	it( 'stages edits made from the dropdown form', async () => {
		mockedUseInlineControlsFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Widget settings',
		} );

		await user.selectOptions(
			within( dialog ).getByRole( 'combobox', { name: 'Metric' } ),
			'orders'
		);

		expect( screen.getByTestId( 'metric' ) ).toHaveTextContent( 'orders' );
	} );

	it( 'reaches the settings surface from the dropdown', async () => {
		mockedUseInlineControlsFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Widget settings',
		} );

		await user.click(
			within( dialog ).getByRole( 'button', { name: 'More settings' } )
		);

		expect(
			await screen.findByRole( 'dialog', { name: 'Snapshot settings' } )
		).toBeInTheDocument();

		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Widget settings' } )
			).not.toBeInTheDocument()
		);
	} );
} );
