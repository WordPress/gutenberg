/* eslint-disable react/jsx-filename-extension -- This package does not have a TypeScript dev project. */
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { Navigator } from '@wordpress/components';
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
	it( 'separates adjacent preset action buttons', async () => {
		await renderInNavigator(
			<>
				{ /* eslint-disable-next-line @wordpress/no-setting-ds-tokens -- Supply the Stack gap token without adding a production theme dependency. */ }
				<div style={ { '--wpds-dimension-gap-xs': '4px' } }>
					<PresetGroup
						label="Shadows"
						items={ [ { name: 'Natural', slug: 'natural' } ] }
						getEditPath={ ( slug ) => `/shadows/${ slug }` }
						addLabel="Add shadow"
						onAdd={ vi.fn() }
						menuAction={ {
							label: 'Reset shadows',
							optionsLabel: 'Shadow options',
							confirmText: 'Reset all shadows?',
							confirmButtonText: 'Reset',
							onConfirm: vi.fn(),
						} }
					/>
				</div>
			</>
		);

		const addButtonRect = screen
			.getByRole( 'button', { name: 'Add shadow' } )
			.getBoundingClientRect();
		const menuButtonRect = screen
			.getByRole( 'button', { name: 'Shadow options' } )
			.getBoundingClientRect();

		expect(
			menuButtonRect.left - addButtonRect.right
		).toBeGreaterThanOrEqual( 4 );
	} );

	it( 'centers the reset label and returns focus to the menu trigger', async () => {
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
		const resetItem = await screen.findByRole( 'menuitem', {
			name: 'Reset shadows',
		} );
		const itemRect = resetItem.getBoundingClientRect();
		const labelRect = screen
			.getByText( 'Reset shadows' )
			.getBoundingClientRect();

		expect( labelRect.top + labelRect.height / 2 ).toBeCloseTo(
			itemRect.top + itemRect.height / 2,
			0
		);

		await user.click( resetItem );

		const dialog = await screen.findByRole( 'dialog' );
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
		await user.click(
			await screen.findByRole( 'menuitemradio', { name: 'Customized' } )
		);

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );

		await user.click( trigger );
		expect(
			await screen.findByRole( 'menuitemradio', { name: 'Customized' } )
		).toBeChecked();
	} );
} );
/* eslint-enable react/jsx-filename-extension */
