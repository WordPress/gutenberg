import '@testing-library/jest-dom/vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from '@wordpress/element';
import type { WidgetType } from '@wordpress/widget-primitives';
import { WidgetLayoutControls } from '../components/widget-layout-controls/widget-layout-controls';
import { useDashboardInternalContext } from '../context/dashboard-context';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, DashboardWidthOption } from '../types';

const warningMock = vi.hoisted( () => vi.fn() );

vi.mock( import( '@wordpress/warning' ), () => ( {
	default: warningMock,
} ) );

const widget: DashboardWidget = {
	uuid: 'a',
	type: 'core/test',
	placement: { width: 1, height: 1 },
};

const widthOptions: DashboardWidthOption[] = [
	{ value: 1, label: 'Half width' },
	{ value: 'full', label: 'Full width' },
];

function LayoutControls() {
	const { layout } = useDashboardInternalContext();
	return (
		<>
			<WidgetLayoutControls widget={ layout[ 0 ] } />
			<output>{ String( layout[ 0 ].placement?.width ) }</output>
		</>
	);
}

function renderDashboard( choices?: readonly DashboardWidthOption[] ) {
	return render(
		<WidgetDashboard
			layout={ [ widget ] }
			onLayoutChange={ () => {} }
			widgetTypes={ [] }
			editMode
			widthOptions={ choices }
		>
			<LayoutControls />
		</WidgetDashboard>
	);
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'wordpress/welcome',
		title: 'Welcome',
		renderModule: 'welcome-module',
		example: { attributes: {} },
	},
];

function InserterHarness( {
	choices,
	onLayoutChange,
}: {
	choices: readonly DashboardWidthOption[];
	onLayoutChange: ( layout: DashboardWidget[] ) => void;
} ) {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( [] );
	const [ editMode, setEditMode ] = useState( true );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ ( next ) => {
				setLayout( next );
				onLayoutChange( next );
			} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			widthOptions={ choices }
			resolveWidgetModule={ async () => ( {
				default: () => <div>welcome</div>,
			} ) }
		/>
	);
}

describe( 'WidgetDashboard width options', () => {
	it( 'offers the host choices and stores the selected token', async () => {
		const user = userEvent.setup();
		await renderDashboard( widthOptions );

		const trigger = screen.getByRole( 'button', {
			name: 'Widget options',
		} );
		await user.click( trigger );

		const half = await screen.findByRole( 'menuitemradio', {
			name: 'Half width',
		} );
		const full = screen.getByRole( 'menuitemradio', {
			name: 'Full width',
		} );
		expect( half ).toBeChecked();
		expect( full ).not.toBeChecked();

		await user.click( full );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'full' );
		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);
		expect( trigger ).toHaveFocus();

		await user.click( trigger );
		expect(
			await screen.findByRole( 'menuitemradio', {
				name: 'Full width',
			} )
		).toBeChecked();

		// The numeric token round-trips through the menu's string values.
		await user.click(
			screen.getByRole( 'menuitemradio', { name: 'Half width' } )
		);
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );
	} );

	it( 'treats `fill` as a menu choice', async () => {
		const user = userEvent.setup();
		await renderDashboard( [
			{ value: 'fill', label: 'Available width' },
			{ value: 'full', label: 'Full width' },
		] );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget options' } )
		);
		await user.click(
			await screen.findByRole( 'menuitemradio', {
				name: 'Available width',
			} )
		);

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'fill' );
	} );

	it( 'does not offer a width menu when the configuration is invalid', async () => {
		await renderDashboard( [] );

		expect(
			screen.queryByRole( 'button', { name: 'Widget options' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toBeInTheDocument();
		expect( warningMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'starts inserted widgets at the first choice', async () => {
		const user = userEvent.setup();
		const onLayoutChange = vi.fn();
		await render(
			<InserterHarness
				choices={ [
					{ value: 'full', label: 'Full width' },
					{ value: 1, label: 'Half width' },
				] }
				onLayoutChange={ onLayoutChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		await user.click( within( dialog ).getAllByRole( 'option' )[ 0 ] );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const [ inserted ] = onLayoutChange.mock.calls[ 0 ];
		expect( inserted ).toHaveLength( 1 );
		expect( inserted[ 0 ].placement?.width ).toBe( 'full' );
	} );

	it( 'rejects insertions when the configuration is invalid', async () => {
		const user = userEvent.setup();
		const onLayoutChange = vi.fn();
		await render(
			<InserterHarness choices={ [] } onLayoutChange={ onLayoutChange } />
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		await user.click( within( dialog ).getAllByRole( 'option' )[ 0 ] );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);

		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Add widget' } )
			).not.toBeInTheDocument()
		);
		// The rejected insertion leaves nothing staged, so there is no
		// change to publish.
		expect(
			screen.getByRole( 'button', { name: 'Done' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect( onLayoutChange ).not.toHaveBeenCalled();
	} );
} );
