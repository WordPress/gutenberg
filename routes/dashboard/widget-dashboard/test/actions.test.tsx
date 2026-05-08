/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, WidgetType } from '../types';

const widgetTypes: WidgetType[] = [];
const layout: DashboardWidget[] = [];

interface HarnessProps {
	initialEditMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
}

function Harness( { initialEditMode = false, onEditChange }: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ () => {} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ ( next ) => {
				setEditMode( next );
				onEditChange?.( next );
			} }
		>
			<WidgetDashboard.Actions />
		</WidgetDashboard>
	);
}

describe( 'WidgetDashboard.Actions', () => {
	it( 'renders the Customize button when editMode is false', () => {
		render( <Harness /> );

		expect(
			screen.getByRole( 'button', { name: 'Customize' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Done' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the Done button when editMode is true', () => {
		render( <Harness initialEditMode /> );

		expect(
			screen.getByRole( 'button', { name: 'Done' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Customize' } )
		).not.toBeInTheDocument();
	} );

	it( 'fires onEditChange with the toggled value on click', async () => {
		const onEditChange = jest.fn();
		render( <Harness onEditChange={ onEditChange } /> );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Customize' } )
		);
		expect( onEditChange ).toHaveBeenLastCalledWith( true );

		await userEvent.click( screen.getByRole( 'button', { name: 'Done' } ) );
		expect( onEditChange ).toHaveBeenLastCalledWith( false );
		expect( onEditChange ).toHaveBeenCalledTimes( 2 );

		// TODO: drop once Done has its own committed behavior; today it logs.

		expect( console ).toHaveLogged( 'done' );
	} );

	it( 'renders nothing when onEditChange is not provided', () => {
		render(
			<WidgetDashboard
				layout={ layout }
				onLayoutChange={ () => {} }
				widgetTypes={ widgetTypes }
			>
				<WidgetDashboard.Actions />
			</WidgetDashboard>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Customize' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Done' } )
		).not.toBeInTheDocument();
	} );

	it( 'throws when used outside a WidgetDashboard subtree', () => {
		const spy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		expect( () => render( <WidgetDashboard.Actions /> ) ).toThrow(
			/Dashboard compound used outside a WidgetDashboard subtree/
		);

		spy.mockRestore();
	} );
} );
