/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import URLPopover from '../';

jest.useRealTimers();

describe( 'URLPopover', () => {
	it( 'matches the snapshot in its default state', async () => {
		const { container } = render(
			<URLPopover
				animate={ false }
				renderSettings={ () => <div>Settings</div> }
			>
				<div>Editor</div>
			</URLPopover>
		);

		// wait for `Popover` effects to finish
		await act( () => Promise.resolve() );

		expect( container ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when the settings are toggled open', async () => {
		const user = userEvent.setup();
		const { container } = render(
			<URLPopover
				animate={ false }
				renderSettings={ () => <div>Settings</div> }
			>
				<div>Editor</div>
			</URLPopover>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Link settings' } )
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when there are no settings', async () => {
		const { container } = render(
			<URLPopover animate={ false }>
				<div>Editor</div>
			</URLPopover>
		);

		// wait for `Popover` effects to finish
		await act( () => Promise.resolve() );

		expect( container ).toMatchSnapshot();
	} );
} );
