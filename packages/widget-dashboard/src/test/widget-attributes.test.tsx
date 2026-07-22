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
import { useInlineFit } from '../components/widget-attributes/use-inline-fit';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

jest.mock( '../components/widget-attributes/use-inline-fit', () => ( {
	useInlineFit: jest.fn(),
} ) );

const mockedUseInlineFit = jest.mocked( useInlineFit );

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

describe( 'WidgetAttributes fit', () => {
	beforeEach( () => {
		mockedUseInlineFit.mockReturnValue( {
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
			screen.queryByRole( 'dialog', { name: 'Widget controls' } )
		).not.toBeInTheDocument();
	} );

	it( 'collapses the fields into a dropdown when space runs out', async () => {
		mockedUseInlineFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		// The settings trigger is not part of the collapse.
		expect(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		).toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: 'Widget controls' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Widget controls',
		} );

		// The high-relevance fields render as a labeled form…
		expect(
			within( dialog ).getByRole( 'combobox', { name: 'Metric' } )
		).toBeInTheDocument();
		expect(
			within( dialog ).getByRole( 'combobox', { name: 'Period' } )
		).toBeInTheDocument();
		// …the low-relevance one stays on the settings surface, with no
		// entry point inside the dropdown.
		expect(
			within( dialog ).queryByLabelText( 'Label' )
		).not.toBeInTheDocument();
		expect(
			within( dialog ).queryByRole( 'button', { name: 'More settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'stages edits made from the dropdown form', async () => {
		mockedUseInlineFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget controls' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Widget controls',
		} );

		await user.selectOptions(
			within( dialog ).getByRole( 'combobox', { name: 'Metric' } ),
			'orders'
		);

		expect( screen.getByTestId( 'metric' ) ).toHaveTextContent( 'orders' );
	} );

	it( 'dismisses the dropdown with Escape and restores focus', async () => {
		mockedUseInlineFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget controls' } )
		);
		await screen.findByRole( 'dialog', { name: 'Widget controls' } );

		await user.keyboard( '{Escape}' );

		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Widget controls' } )
			).not.toBeInTheDocument()
		);
		// Focus returns to the invoker, per the dialog pattern.
		expect(
			screen.getByRole( 'button', { name: 'Widget controls' } )
		).toHaveFocus();
	} );

	it( 'locks the fit while the dropdown is open', async () => {
		mockedUseInlineFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		expect( mockedUseInlineFit ).toHaveBeenLastCalledWith(
			expect.objectContaining( { locked: false } )
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Widget controls' } )
		);
		await screen.findByRole( 'dialog', { name: 'Widget controls' } );

		expect( mockedUseInlineFit ).toHaveBeenLastCalledWith(
			expect.objectContaining( { locked: true } )
		);

		await user.keyboard( '{Escape}' );
		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Widget controls' } )
			).not.toBeInTheDocument()
		);

		// Escape restores focus to the trigger, which keeps the hold.
		expect( mockedUseInlineFit ).toHaveBeenLastCalledWith(
			expect.objectContaining( { locked: true } )
		);

		// The hold releases once focus moves on.
		await user.tab();
		await waitFor( () =>
			expect( mockedUseInlineFit ).toHaveBeenLastCalledWith(
				expect.objectContaining( { locked: false } )
			)
		);
	} );

	it( 'locks the fit while the inline form has focus', async () => {
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		await user.click( screen.getAllByRole( 'combobox' )[ 0 ] );

		expect( mockedUseInlineFit ).toHaveBeenLastCalledWith(
			expect.objectContaining( { locked: true } )
		);

		// Focus leaves the inline form.
		await user.click( screen.getByTestId( 'metric' ) );

		await waitFor( () =>
			expect( mockedUseInlineFit ).toHaveBeenLastCalledWith(
				expect.objectContaining( { locked: false } )
			)
		);
	} );

	it( 'keeps the settings surface reachable while collapsed', async () => {
		mockedUseInlineFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: true,
		} );
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);

		expect(
			await screen.findByRole( 'dialog', { name: 'Snapshot settings' } )
		).toBeInTheDocument();
	} );
} );
