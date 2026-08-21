import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { Navigator } from '@wordpress/components';
import PresetEditHeader from '../presets/preset-edit-header';
import PresetGroup from '../presets/preset-group';
import ScreenBlockList from '../screen-block-list';

function renderInNavigator( children ) {
	return render(
		<Navigator initialPath="/">
			<Navigator.Screen path="/">{ children }</Navigator.Screen>
		</Navigator>
	);
}

describe( 'Global Styles menus', () => {
	it( 'keeps disabled preset actions unavailable', async () => {
		const onClick = jest.fn();

		renderInNavigator(
			<PresetEditHeader
				title="Shadow"
				menuLabel="Shadow options"
				menuItems={ [
					{
						label: 'Reset shadow',
						onClick,
						disabled: true,
					},
				] }
			/>
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Shadow options' } )
		);
		const resetAction = await screen.findByRole( 'menuitem', {
			name: 'Reset shadow',
		} );

		expect( resetAction ).toHaveAttribute( 'aria-disabled', 'true' );
		fireEvent.click( resetAction );
		expect( onClick ).not.toHaveBeenCalled();
	} );

	it( 'opens the reset dialog and returns focus to the menu trigger', async () => {
		renderInNavigator(
			<PresetGroup
				label="Shadows"
				items={ [ { name: 'Natural', slug: 'natural' } ] }
				getEditPath={ ( slug ) => `/shadows/${ slug }` }
				menuAction={ {
					label: 'Reset shadows',
					optionsLabel: 'Shadow options',
					confirmText: 'Reset all shadows?',
					confirmButtonText: 'Reset',
					onConfirm: jest.fn(),
				} }
			/>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'Shadow options',
		} );
		fireEvent.click( trigger );
		fireEvent.click(
			await screen.findByRole( 'menuitem', { name: 'Reset shadows' } )
		);

		const dialog = await screen.findByRole( 'dialog' );
		expect(
			within( dialog ).getByText( 'Reset all shadows?' )
		).toBeVisible();
		expect( dialog ).toHaveFocus();
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();

		fireEvent.click(
			within( dialog ).getByRole( 'button', { name: 'Cancel' } )
		);
		await waitFor( () => {
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();
	} );

	it( 'selects a block filter and closes the menu', async () => {
		renderInNavigator( <ScreenBlockList /> );

		const trigger = screen.getByRole( 'button', {
			name: 'Filter blocks',
		} );
		fireEvent.click( trigger );

		expect(
			await screen.findByRole( 'menuitemradio', { name: 'All blocks' } )
		).toBeChecked();
		fireEvent.click(
			screen.getByRole( 'menuitemradio', { name: 'Customized' } )
		);

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();

		fireEvent.click( trigger );
		expect(
			await screen.findByRole( 'menuitemradio', { name: 'Customized' } )
		).toBeChecked();
	} );
} );
