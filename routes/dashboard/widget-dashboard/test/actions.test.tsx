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
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, WidgetGridSettings } from '../types';

const widgetTypes: WidgetType[] = [];

// Use a non-empty layout so the provider's auto-edit-when-empty effect
// does not flip editMode on as a side effect of mounting.
const layout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
];

const gridSettings: WidgetGridSettings = {
	model: 'grid',
	minColumnWidth: 350,
	rowHeight: 200,
};

interface HarnessProps {
	initialEditMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	onLayoutChange?: ( next: DashboardWidget[] ) => void;
	onGridSettingsChange?: ( next: WidgetGridSettings ) => void;
}

function Harness( {
	initialEditMode = false,
	onEditChange,
	onLayoutChange = () => {},
	onGridSettingsChange,
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ onLayoutChange }
			gridSettings={ gridSettings }
			onGridSettingsChange={ onGridSettingsChange }
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

	describe( 'Layout settings', () => {
		it( 'is hidden when editMode is false', () => {
			render( <Harness onGridSettingsChange={ () => {} } /> );

			expect(
				screen.queryByRole( 'button', { name: 'Layout settings' } )
			).not.toBeInTheDocument();
		} );

		it( 'is visible in the edit toolbar when grid settings are editable', () => {
			render(
				<Harness initialEditMode onGridSettingsChange={ () => {} } />
			);

			expect(
				screen.getByRole( 'button', { name: 'Layout settings' } )
			).toBeInTheDocument();
		} );

		it( 'is hidden when onGridSettingsChange is not provided', () => {
			render( <Harness initialEditMode /> );

			expect(
				screen.queryByRole( 'button', { name: 'Layout settings' } )
			).not.toBeInTheDocument();
		} );

		it( 'opens the layout settings drawer when clicked', async () => {
			render(
				<Harness initialEditMode onGridSettingsChange={ () => {} } />
			);

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Layout settings' } )
			);

			expect(
				await screen.findByRole( 'dialog', { name: 'Layout settings' } )
			).toBeInTheDocument();
		} );

		it( 'is not in the more-actions menu', async () => {
			const onLayoutReset = jest.fn();
			render(
				<WidgetDashboard
					layout={ layout }
					onLayoutChange={ () => {} }
					onLayoutReset={ onLayoutReset }
					gridSettings={ gridSettings }
					onGridSettingsChange={ () => {} }
					widgetTypes={ widgetTypes }
					editMode
					onEditChange={ () => {} }
				>
					<WidgetDashboard.Actions />
				</WidgetDashboard>
			);

			await userEvent.click(
				screen.getByRole( 'button', { name: 'More options' } )
			);

			expect(
				screen.queryByRole( 'menuitem', { name: 'Layout settings' } )
			).not.toBeInTheDocument();
		} );
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
