/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormToggle, { noop } from '..';
import type { FormToggleProps } from '../types';

const getInput = () => screen.getByRole( 'checkbox' ) as HTMLInputElement;

const ControlledFormToggle = ( { onChange }: FormToggleProps ) => {
	const [ isChecked, setChecked ] = useState( false );
	return (
		<FormToggle
			checked={ isChecked }
			onChange={ ( value ) => {
				setChecked( ( state ) => ! state );
				onChange( value );
			} }
		/>
	);
};

describe( 'FormToggle', () => {
	describe( 'basic rendering', () => {
		it( 'should render a span element with an unchecked checkbox', async () => {
			const { container } = await render(
				<FormToggle onChange={ noop } />
			);

			expect( getInput() ).not.toBeChecked();
			expect( container ).toMatchSnapshot();
		} );

		it( 'should render a checked checkbox when providing checked prop', async () => {
			await render( <FormToggle onChange={ noop } checked /> );

			expect( getInput() ).toBeChecked();
		} );

		it( 'should render with an additional className', async () => {
			const { container: containerDefault } = await render(
				<FormToggle onChange={ noop } />
			);

			const { container: containerWithClassName } = await render(
				<FormToggle onChange={ noop } className="testing" />
			);

			// Expect the diff snapshot to be mostly about the className.
			expect( containerDefault ).toMatchDiffSnapshot(
				containerWithClassName
			);
		} );

		it( 'should render an id prop for the input checkbox', async () => {
			const { container: containerDefault } = await render(
				<FormToggle onChange={ noop } />
			);

			const { container: containerWithID } = await render(
				// Disabled because of our rule restricting literal IDs, preferring
				// `withInstanceId`. In this case, it's fine to use literal IDs.
				// eslint-disable-next-line no-restricted-syntax
				<FormToggle onChange={ noop } id="test" />
			);

			// Expect the diff snapshot to be mostly about the ID.
			expect( containerDefault ).toMatchDiffSnapshot( containerWithID );
		} );
	} );

	describe( 'Value', () => {
		it( 'should flip the checked property when clicked', async () => {
			const user = userEvent.setup();

			const onChange = jest.fn();
			await render( <ControlledFormToggle onChange={ onChange } /> );

			const input = getInput();

			await user.click( input );
			expect( onChange.mock.calls[ 0 ][ 0 ].target ).toBeInTheDocument();
			expect( input ).toBeChecked();

			await user.click( input );
			expect( onChange.mock.calls[ 1 ][ 0 ].target ).toBeInTheDocument();
			expect( input ).not.toBeChecked();

			expect( onChange ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
