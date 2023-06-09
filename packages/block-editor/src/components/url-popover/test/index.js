/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import URLPopover from '../';

/**
 * Returns the first found popover element up the DOM tree.
 *
 * @param {HTMLElement} element Element to start with.
 * @return {HTMLElement|null} Popover element, or `null` if not found.
 */
function getWrappingPopoverElement( element ) {
	return element.closest( '.components-popover' );
}

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

		await waitFor( () =>
			expect(
				getWrappingPopoverElement( screen.getByText( 'Editor' ) )
			).toBePositionedPopover()
		);

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

		await waitFor( () =>
			expect(
				getWrappingPopoverElement( screen.getByText( 'Editor' ) )
			).toBePositionedPopover()
		);

		expect( container ).toMatchSnapshot();
	} );
} );
