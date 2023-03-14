/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import BlockAlignmentUI from '../ui';

describe( 'BlockAlignmentUI', () => {
	const alignment = 'left';
	const onChange = jest.fn();

	afterEach( () => {
		onChange.mockClear();
	} );

	test( 'should match snapshot when controls are hidden', () => {
		const { container } = render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should match snapshot when controls are visible', () => {
		const { container } = render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
				isCollapsed={ false }
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should expand controls when toggled', async () => {
		const user = userEvent.setup();

		const { unmount } = render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
			/>
		);

		expect(
			screen.queryByRole( 'menuitemradio', {
				name: /^Align \w+$/,
			} )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Align',
			} )
		);

		expect(
			screen.getAllByRole( 'menuitemradio', {
				name: /^Align \w+$/,
			} )
		).toHaveLength( 3 );

		// Cancel running effects, like delayed dropdown menu popover positioning.
		unmount();
	} );

	test( 'should call onChange with undefined, when the control is already active', async () => {
		const user = userEvent.setup();

		render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
				isCollapsed={ false }
			/>
		);

		const activeControl = screen.getByRole( 'button', {
			name: `Align ${ alignment }`,
			pressed: true,
		} );

		await user.click( activeControl );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	test( 'should call onChange with alignment value when the control is inactive', async () => {
		const user = userEvent.setup();

		render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
				isCollapsed={ false }
			/>
		);

		const inactiveControl = screen.getByRole( 'button', {
			name: 'Align center',
			pressed: false,
		} );

		await user.click( inactiveControl );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 'center' );
	} );
} );
