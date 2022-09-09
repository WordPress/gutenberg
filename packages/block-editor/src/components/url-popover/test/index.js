/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import URLPopover from '../';

describe( 'URLPopover', () => {
	it( 'matches the snapshot in its default state', () => {
		const { container } = render(
			<URLPopover renderSettings={ () => <div>Settings</div> }>
				<div>Editor</div>
			</URLPopover>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when the settings are toggled open', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const { container } = render(
			<URLPopover renderSettings={ () => <div>Settings</div> }>
				<div>Editor</div>
			</URLPopover>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Link settings' } )
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when there are no settings', () => {
		const { container } = render(
			<URLPopover>
				<div>Editor</div>
			</URLPopover>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
