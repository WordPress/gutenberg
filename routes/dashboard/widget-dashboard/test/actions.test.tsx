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

// Use a non-empty layout so the provider's auto-edit-when-empty effect
// does not flip editMode on as a side effect of mounting.
const layout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
];

interface HarnessProps {
	initialEditMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	onLayoutChange?: ( next: DashboardWidget[] ) => void;
}

function Harness( {
	initialEditMode = false,
	onEditChange,
	onLayoutChange = () => {},
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ onLayoutChange }
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

	it( 'fires onEditChange with true when Customize is clicked', async () => {
		const onEditChange = jest.fn();
		render( <Harness onEditChange={ onEditChange } /> );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Customize' } )
		);

		expect( onEditChange ).toHaveBeenLastCalledWith( true );
	} );

	it( 'disables Done when there are no staging changes', () => {
		render( <Harness initialEditMode /> );

		expect(
			screen.getByRole( 'button', { name: 'Done' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'fires onEditChange with false when Cancel is clicked', async () => {
		const onEditChange = jest.fn();
		const onLayoutChange = jest.fn();
		render(
			<Harness
				initialEditMode
				onEditChange={ onEditChange }
				onLayoutChange={ onLayoutChange }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Cancel' } )
		);

		expect( onEditChange ).toHaveBeenLastCalledWith( false );
		expect( onLayoutChange ).not.toHaveBeenCalled();
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
