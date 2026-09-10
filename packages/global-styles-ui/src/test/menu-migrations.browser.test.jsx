/* eslint-disable react/jsx-filename-extension -- This package does not have a TypeScript dev project. */
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
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
	it( 'does not run disabled preset actions', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();

		await renderInNavigator(
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

		await user.click(
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
		const user = userEvent.setup();
		await renderInNavigator(
			<PresetGroup
				label="Shadows"
				items={ [ { name: 'Natural', slug: 'natural' } ] }
				getEditPath={ ( slug ) => `/shadows/${ slug }` }
				menuAction={ {
					label: 'Reset shadows',
					optionsLabel: 'Shadow options',
					confirmText: 'Reset all shadows?',
					confirmButtonText: 'Reset',
					onConfirm: vi.fn(),
				} }
			/>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'Shadow options',
		} );
		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Reset shadows' } )
		);

		const dialog = await screen.findByRole( 'dialog' );
		expect(
			within( dialog ).getByText( 'Reset all shadows?' )
		).toBeVisible();
		expect( dialog ).toHaveFocus();
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();

		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Cancel' } )
		);
		await waitFor( () => {
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();
	} );

	it( 'selects a block filter and closes the menu', async () => {
		const user = userEvent.setup();
		await renderInNavigator( <ScreenBlockList /> );

		const trigger = screen.getByRole( 'button', {
			name: 'Filter blocks',
		} );
		await user.click( trigger );

		expect(
			await screen.findByRole( 'menuitemradio', { name: 'All blocks' } )
		).toBeChecked();
		await user.click(
			screen.getByRole( 'menuitemradio', { name: 'Customized' } )
		);

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();

		await user.click( trigger );
		expect(
			await screen.findByRole( 'menuitemradio', { name: 'Customized' } )
		).toBeChecked();
	} );
} );
/* eslint-enable react/jsx-filename-extension */
