/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Button from '../../../button';
import { ToolTip } from '..';
import { TOOLTIP_DELAY } from '../../../tooltip/';

const props = {
	children: <Button>This is a button</Button>,
	text: 'tooltip text goes here',
	timeout: TOOLTIP_DELAY,
};

describe( 'ToolTip', () => {
	it( 'should render the tooltip as hidden if there is no focus', () => {
		render( <ToolTip { ...props } /> );

		expect(
			screen.queryByRole( 'tooltip', { hidden: true } )
		).not.toBeVisible();
	} );

	it( 'should render the tooltip as visible on tab', async () => {
		const user = userEvent.setup();

		render( <ToolTip { ...props } /> );

		await user.tab();
		await user.tab();

		expect(
			screen.getByRole( 'button', { name: /This is a button/i } )
		).toHaveFocus();

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', {
					name: /tooltip text goes here/i,
				} )
			).toBeVisible()
		);

		await user.tab();

		expect(
			screen.getByRole( 'tooltip', { hidden: true } )
		).not.toBeVisible();
	} );

	it( 'should render the tooltip as visible on hover', async () => {
		const user = userEvent.setup();
		render( <ToolTip { ...props } /> );

		const button = screen.getByRole( 'button', {
			name: /This is a button/i,
		} );

		await user.hover( button );

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', {
					name: /tooltip text goes here/i,
				} )
			).toBeVisible()
		);

		await user.unhover( button );

		expect(
			screen.getByRole( 'tooltip', { hidden: true } )
		).not.toBeVisible();
	} );

	it( 'should not show tooltip on focus as result of mouse click', async () => {
		const user = userEvent.setup();

		render( <ToolTip { ...props } /> );

		await user.click(
			screen.getByRole( 'button', {
				name: /This is a button/i,
			} )
		);

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text goes here/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the tooltip when an element is disabled', async () => {
		const user = userEvent.setup();
		render(
			<ToolTip text="tooltip text goes here">
				<Button disabled>This is a button</Button>
			</ToolTip>
		);

		const button = screen.getByRole( 'button', {
			name: /This is a button/i,
		} );

		expect( button ).toBeDisabled();
		expect( button ).toBeVisible();

		await user.hover( button );

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', {
					name: /tooltip text goes here/i,
				} )
			).toBeVisible()
		);
	} );
} );
