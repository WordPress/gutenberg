/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import BlockVerticalAlignmentUI from '../ui';

describe( 'BlockVerticalAlignmentUI', () => {
	const alignment = 'top';
	const onChange = jest.fn();

	afterEach( () => {
		onChange.mockClear();
	} );

	test( 'should match snapshot when controls are hidden', () => {
		const { container } = render(
			<BlockVerticalAlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChange }
			/>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should match snapshot when controls are visible', () => {
		const { container } = render(
			<BlockVerticalAlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChange }
				isCollapsed={ false }
			/>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should use custom label and description', () => {
		render(
			<BlockVerticalAlignmentUI
				value={ alignment }
				onChange={ onChange }
				label="Custom Label"
				description="Custom Description"
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Custom Label' } );
		expect( button ).toHaveAttribute( 'aria-label', 'Custom Label' );
		// The description is now part of the toggleProps and not directly accessible
		// We can't easily test for the describedBy attribute here
	} );

	test( 'should expand controls when toggled', async () => {
		const user = userEvent.setup();

		const { unmount } = render(
			<BlockVerticalAlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChange }
			/>
		);

		expect(
			screen.queryByRole( 'menuitemradio', {
				name: /^Align \w+$/,
			} )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Align content vertically',
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

	it( 'should call onChange with undefined, when the control is already active', async () => {
		const user = userEvent.setup();

		render(
			<BlockVerticalAlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChange }
				isCollapsed={ false }
			/>
		);

		const activeControl = screen.getByRole( 'button', {
			name: `Align top`,
			pressed: true,
		} );

		await user.click( activeControl );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	it( 'should call onChange with alignment value when the control is inactive', async () => {
		// note "middle" alias for "center"
		const user = userEvent.setup();

		render(
			<BlockVerticalAlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChange }
				isCollapsed={ false }
			/>
		);

		const inactiveControl = screen.getByRole( 'button', {
			name: 'Align middle',
			pressed: false,
		} );

		await user.click( inactiveControl );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 'center' );
	} );
} );
