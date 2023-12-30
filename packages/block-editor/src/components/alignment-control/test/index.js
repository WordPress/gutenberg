/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { alignLeft, alignCenter } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AlignmentUI from '../ui';

describe( 'AlignmentUI', () => {
	const alignment = 'left';
	const onChangeSpy = jest.fn();

	afterEach( () => {
		onChangeSpy.mockClear();
	} );

	test( 'should match snapshot when controls are hidden', () => {
		const { container } = render(
			<AlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChangeSpy }
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should match snapshot when controls are visible', () => {
		const { container } = render(
			<AlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChangeSpy }
				isCollapsed={ false }
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should expand controls when toggled', async () => {
		const user = userEvent.setup();

		const { unmount } = render(
			<AlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChangeSpy }
			/>
		);

		expect(
			screen.queryByRole( 'menuitemradio', {
				name: /^Align text \w+$/,
			} )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Align text',
			} )
		);

		expect(
			screen.getAllByRole( 'menuitemradio', {
				name: /^Align text \w+$/,
			} )
		).toHaveLength( 3 );

		// Cancel running effects, like delayed dropdown menu popover positioning.
		unmount();
	} );

	test( 'should call on change with undefined when a control is already active', async () => {
		const user = userEvent.setup();

		render(
			<AlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChangeSpy }
				isCollapsed={ false }
			/>
		);

		const activeControl = screen.getByRole( 'button', {
			name: /^Align text \w+$/,
			pressed: true,
		} );

		await user.click( activeControl );

		expect( activeControl ).toHaveAttribute( 'align', alignment );
		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( undefined );
	} );

	test( 'should call on change a new value when the control is not active', async () => {
		const user = userEvent.setup();

		render(
			<AlignmentUI
				isToolbar
				value={ alignment }
				onChange={ onChangeSpy }
				isCollapsed={ false }
			/>
		);

		const inactiveControl = screen.getByRole( 'button', {
			name: 'Align text center',
			pressed: false,
		} );

		await user.click( inactiveControl );

		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( 'center' );
	} );

	test( 'should allow custom alignment controls to be specified', async () => {
		const user = userEvent.setup();

		const { container } = render(
			<AlignmentUI
				isToolbar
				value={ 'custom-right' }
				onChange={ onChangeSpy }
				isCollapsed={ false }
				alignmentControls={ [
					{
						icon: alignLeft,
						title: 'My custom left',
						align: 'custom-left',
					},
					{
						icon: alignCenter,
						title: 'My custom right',
						align: 'custom-right',
					},
				] }
			/>
		);

		expect( container ).toMatchSnapshot();

		expect(
			screen.getAllByRole( 'button', {
				name: /^My custom \w+$/,
			} )
		).toHaveLength( 2 );

		// Should correctly call on change when right alignment is pressed (active alignment)
		const rightControl = screen.getByRole( 'button', {
			name: 'My custom right',
		} );

		await user.click( rightControl );

		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( undefined );
		onChangeSpy.mockClear();

		// Should correctly call on change when right alignment is pressed (inactive alignment)
		const leftControl = screen.getByRole( 'button', {
			name: 'My custom left',
		} );

		await user.click( leftControl );

		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( 'custom-left' );
	} );
} );
