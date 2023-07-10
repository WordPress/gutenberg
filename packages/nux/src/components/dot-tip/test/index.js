/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { DotTip } from '..';

const noop = () => {};

describe( 'DotTip', () => {
	it( 'should not render anything if invisible', async () => {
		render(
			<DotTip>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		await act( () => Promise.resolve() );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should render correctly', async () => {
		render(
			<DotTip isVisible setTimeout={ noop }>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		await act( () => Promise.resolve() );

		expect( screen.getByRole( 'dialog' ) ).toMatchSnapshot();
	} );

	it( 'should call onDismiss when the dismiss button is clicked', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const onDismiss = jest.fn();

		render(
			<DotTip isVisible onDismiss={ onDismiss } setTimeout={ noop }>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		await act( () => Promise.resolve() );

		await user.click( screen.getByRole( 'button', { name: 'Got it' } ) );

		expect( onDismiss ).toHaveBeenCalled();
	} );

	it( 'should call onDisable when the X button is clicked', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const onDisable = jest.fn();

		render(
			<DotTip isVisible onDisable={ onDisable } setTimeout={ noop }>
				It looks like you’re writing a letter. Would you like help?
			</DotTip>
		);

		await act( () => Promise.resolve() );

		await user.click(
			screen.getByRole( 'button', { name: 'Disable tips' } )
		);

		expect( onDisable ).toHaveBeenCalled();
	} );
} );
