import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { useInlineFit } from '../components/widget-attributes/use-inline-fit';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

jest.mock( '../components/widget-attributes/use-inline-fit', () => ( {
	useInlineFit: jest.fn(),
} ) );

const mockedUseInlineFit = jest.mocked( useInlineFit );

function TestWidget( { attributes }: WidgetRenderProps< { label?: string } > ) {
	return <p data-testid="label">{ attributes?.label ?? '' }</p>;
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/snapshot',
		title: 'Snapshot',
		renderModule: 'snapshot-module',
		actions: [
			{ id: 'docs', label: 'Read the docs', href: 'https://w.org' },
			{
				id: 'export',
				label: 'Export CSV',
				href: '/export.csv',
				download: 'report.csv',
			},
			{
				id: 'tab',
				label: 'Open elsewhere',
				href: 'https://w.org/x',
				openInNewTab: true,
			},
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
		attributes: {},
		placement: { width: 'fill', height: 1 },
	},
];

function Harness( { editMode = false }: { editMode?: boolean } ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );
	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ setLayout }
			onLayoutReset={ () => {} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ () => {} }
			resolveWidgetModule={ resolveWidgetModule }
		>
			<WidgetDashboard.Actions />
			<WidgetDashboard.Widgets />
		</WidgetDashboard>
	);
}

describe( 'chrome menus', () => {
	beforeEach( () => {
		mockedUseInlineFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: false,
		} );
	} );

	it( 'surfaces the dashboard actions in the overflow menu', async () => {
		const user = userEvent.setup();
		render( <Harness /> );

		await user.click(
			screen.getByRole( 'button', { name: 'More options' } )
		);

		expect(
			await screen.findByRole( 'menuitem', { name: 'Reset to default…' } )
		).toBeInTheDocument();
	} );

	it( 'mounts widget link actions as real anchors', async () => {
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'label' );

		await user.click( screen.getByRole( 'button', { name: 'More' } ) );

		const docs = await screen.findByRole( 'menuitem', {
			name: 'Read the docs',
		} );
		expect( docs.tagName ).toBe( 'A' );
		expect( docs ).toHaveAttribute( 'href', 'https://w.org' );

		expect(
			screen.getByRole( 'menuitem', { name: 'Export CSV' } )
		).toHaveAttribute( 'download', 'report.csv' );

		const newTab = screen.getByRole( 'menuitem', {
			name: /Open elsewhere/,
		} );
		expect( newTab ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'reports the current width as the selected option', async () => {
		const user = userEvent.setup();
		render( <Harness editMode /> );
		await screen.findByTestId( 'label' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget options' } )
		);

		expect(
			await screen.findByRole( 'menuitemradio', {
				name: 'Use available width',
			} )
		).toBeChecked();

		const full = screen.getByRole( 'menuitemradio', {
			name: 'Make full width',
		} );
		expect( full ).not.toBeChecked();

		await user.click( full );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget options' } )
		);
		expect(
			await screen.findByRole( 'menuitemradio', {
				name: 'Make full width',
			} )
		).toBeChecked();
	} );
} );
