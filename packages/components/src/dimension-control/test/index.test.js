/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { DimensionControl } from '../';

describe( 'DimensionControl', () => {
	const onChangeHandler = jest.fn();
	const instanceId = 1;

	afterEach( () => {
		onChangeHandler.mockClear();
	} );

	describe( 'rendering', () => {
		it( 'renders with defaults', () => {
			const { container } = render(
				<DimensionControl
					instanceId={ instanceId }
					label={ 'Padding' }
				/>
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'renders with icon and default icon label', () => {
			const { container } = render(
				<DimensionControl
					instanceId={ instanceId }
					label={ 'Margin' }
					icon={ plus }
				/>
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'renders with icon and custom icon label', () => {
			const { container } = render(
				<DimensionControl
					instanceId={ instanceId }
					label={ 'Margin' }
					icon={ plus }
					iconLabel={ 'Tablet Devices' }
				/>
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'renders with custom sizes', () => {
			const customSizes = [
				{
					name: 'Mini',
					size: 1,
					slug: 'mini',
				},
				{
					name: 'Middle',
					size: 5,
					slug: 'middle',
				},
				{
					name: 'Giant',
					size: 10,
					slug: 'giant',
				},
			];

			const { container } = render(
				<DimensionControl
					instanceId={ instanceId }
					label={ 'Custom Dimension' }
					sizes={ customSizes }
				/>
			);
			expect( container ).toMatchSnapshot();
		} );
	} );

	describe( 'callbacks', () => {
		it( 'should call onChange handler with correct args on size change', async () => {
			const user = userEvent.setup();

			render(
				<DimensionControl
					instanceId={ instanceId }
					label={ 'Padding' }
					onChange={ onChangeHandler }
				/>
			);

			await user.selectOptions( screen.getByRole( 'combobox' ), 'small' );
			await user.selectOptions(
				screen.getByRole( 'combobox' ),
				'medium'
			);

			expect( onChangeHandler ).toHaveBeenCalledTimes( 2 );
			expect( onChangeHandler.mock.calls[ 0 ][ 0 ] ).toEqual( 'small' );
			expect( onChangeHandler.mock.calls[ 1 ][ 0 ] ).toEqual( 'medium' );
		} );

		it( 'should call onChange handler with undefined value when no size is provided on change', async () => {
			const user = userEvent.setup();

			render(
				<DimensionControl
					instanceId={ instanceId }
					label={ 'Padding' }
					onChange={ onChangeHandler }
				/>
			);

			// Select the "default" <option />
			await user.selectOptions( screen.getByRole( 'combobox' ), '' );

			expect( onChangeHandler ).toHaveBeenNthCalledWith( 1, undefined );
		} );
	} );
} );
