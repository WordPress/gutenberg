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
} );
