/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { DimensionControl } from '../';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'DimensionControl', () => {
	const onChangeHandler = jest.fn();
	const instanceId = 1;

	afterEach( () => {
		onChangeHandler.mockClear();
	} );

	describe( 'rendering', () => {
		it( 'renders with defaults', async () => {
			const container = createContainer();
			await render(
				<DimensionControl instanceId={ instanceId } label="Padding" />,
				{ container }
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'renders with icon and default icon label', async () => {
			const container = createContainer();
			await render(
				<DimensionControl
					instanceId={ instanceId }
					label="Margin"
					icon={ plus }
				/>,
				{ container }
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'renders with icon and custom icon label', async () => {
			const container = createContainer();
			await render(
				<DimensionControl
					instanceId={ instanceId }
					label="Margin"
					icon={ plus }
					iconLabel="Tablet Devices"
				/>,
				{ container }
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'renders with custom sizes', async () => {
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

			const container = createContainer();
			await render(
				<DimensionControl
					instanceId={ instanceId }
					label="Custom Dimension"
					sizes={ customSizes }
				/>,
				{ container }
			);
			expect( container ).toMatchSnapshot();
		} );
	} );

	describe( 'callbacks', () => {
		it( 'should call onChange handler with correct args on size change', async () => {
			const user = userEvent.setup();

			await render(
				<DimensionControl
					instanceId={ instanceId }
					label="Padding"
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

			await render(
				<DimensionControl
					instanceId={ instanceId }
					label="Padding"
					onChange={ onChangeHandler }
				/>
			);

			// Select the "default" <option />
			await user.selectOptions( screen.getByRole( 'combobox' ), '' );

			expect( onChangeHandler ).toHaveBeenNthCalledWith( 1, undefined );
		} );
	} );
} );
