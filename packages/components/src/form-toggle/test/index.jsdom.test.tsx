import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import { logged } from '@wordpress/deprecated';
import { noop } from '..';
import FormToggle from '../deprecated';
import ToggleControl from '../../toggle-control';
import type { FormToggleProps } from '../types';

const DEPRECATION_MESSAGE =
	'wp.components.FormToggle is deprecated since version 7.3 and will be removed in version 7.5. Please use Switch from @wordpress/ui instead.';

globalThis.wpVitest.mockMatchMedia();

beforeEach( () => {
	logged[ DEPRECATION_MESSAGE ] = true;
} );

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
	it( 'warns when rendering the deprecated component', () => {
		delete logged[ DEPRECATION_MESSAGE ];
		render( <FormToggle onChange={ noop } /> );

		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
	} );

	it( 'does not warn when rendering ToggleControl', () => {
		delete logged[ DEPRECATION_MESSAGE ];
		render( <ToggleControl label="My toggle" onChange={ noop } /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'My toggle' } )
		).toBeVisible();
		expect( console ).not.toHaveWarned();
	} );

	describe( 'basic rendering', () => {
		it( 'should render a span element with an unchecked checkbox', () => {
			const { container } = render( <FormToggle onChange={ noop } /> );

			expect( getInput() ).not.toBeChecked();
			expect( container ).toMatchSnapshot();
		} );

		it( 'should render a checked checkbox when providing checked prop', () => {
			const ref = createRef< HTMLInputElement >();
			render( <FormToggle onChange={ noop } checked ref={ ref } /> );

			expect( getInput() ).toBeChecked();
			expect( ref.current ).toBe( getInput() );
		} );

		it( 'should render with an additional className', () => {
			const { container } = render(
				<FormToggle onChange={ noop } className="testing" />
			);

			// The class is applied to a non-semantic wrapper.
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'testing' );
		} );

		it( 'should render an id prop for the input checkbox', () => {
			render( <FormToggle onChange={ noop } id="test" /> );

			expect( getInput() ).toHaveAttribute( 'id', 'test' );
		} );
	} );

	describe( 'Value', () => {
		it( 'should flip the checked property when clicked', async () => {
			const user = userEvent.setup();

			const onChange = vi.fn();
			render( <ControlledFormToggle onChange={ onChange } /> );

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
