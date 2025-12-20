/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { DotTip } from '..';

describe( 'DotTip', () => {
	it( 'should not render anything if invisible', () => {
		render(
			<DotTip>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should render correctly', async () => {
		render(
			<DotTip isVisible>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		// Wait for the dialog element to be positioned (aligned with the button)
		await waitFor( () =>
			expect( screen.getByRole( 'dialog' ) ).toBePositionedPopover()
		);

		expect( screen.getByRole( 'dialog' ) ).toMatchSnapshot();
	} );

	it( 'should call onDismiss when the dismiss button is clicked', async () => {
		const user = userEvent.setup();
		const onDismiss = jest.fn();

		render(
			<DotTip isVisible onDismiss={ onDismiss }>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		await waitFor( () =>
			expect( screen.getByRole( 'dialog' ) ).toBePositionedPopover()
		);

		await user.click( screen.getByRole( 'button', { name: 'Got it' } ) );

		expect( onDismiss ).toHaveBeenCalled();
	} );

	it( 'should call onDisable when the X button is clicked', async () => {
		const user = userEvent.setup();
		const onDisable = jest.fn();

		render(
			<DotTip isVisible onDisable={ onDisable }>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		await waitFor( () =>
			expect( screen.getByRole( 'dialog' ) ).toBePositionedPopover()
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Disable tips' } )
		);

		expect( onDisable ).toHaveBeenCalled();
	} );
} );
