import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { Input } from '../index';

describe( 'Input', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLInputElement >();

		render( <Input ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLInputElement );
	} );

	describe( 'aria-valuetext on number inputs', () => {
		it( 'uses the controlled value', () => {
			const { rerender } = render(
				<Input type="number" min={ 0 } max={ 23 } value={ 18 } />
			);

			expect( screen.getByRole( 'spinbutton' ) ).toHaveAttribute(
				'aria-valuetext',
				'18'
			);

			rerender( <Input type="number" min={ 0 } max={ 23 } value="" /> );

			expect( screen.getByRole( 'spinbutton' ) ).not.toHaveAttribute(
				'aria-valuetext'
			);
		} );

		it( 'follows the value of an uncontrolled input', async () => {
			const user = userEvent.setup();

			render(
				<form>
					<Input type="number" max={ 23 } defaultValue={ 5 } />
					<button type="reset">Reset</button>
				</form>
			);

			const input = screen.getByRole( 'spinbutton' );
			expect( input ).toHaveAttribute( 'aria-valuetext', '5' );

			await user.clear( input );
			expect( input ).not.toHaveAttribute( 'aria-valuetext' );

			await user.type( input, '12' );
			expect( input ).toHaveAttribute( 'aria-valuetext', '12' );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
			expect( input ).toHaveValue( 5 );
			await waitFor( () =>
				expect( input ).toHaveAttribute( 'aria-valuetext', '5' )
			);
		} );

		it( 'keeps an aria-valuetext passed by the consumer', () => {
			render(
				<Input
					type="number"
					max={ 23 }
					value={ 18 }
					aria-valuetext="18 hours"
				/>
			);

			expect( screen.getByRole( 'spinbutton' ) ).toHaveAttribute(
				'aria-valuetext',
				'18 hours'
			);
		} );

		it( 'is not set on other input types', () => {
			render( <Input value="18" onChange={ () => {} } /> );

			expect( screen.getByRole( 'textbox' ) ).not.toHaveAttribute(
				'aria-valuetext'
			);
		} );
	} );
} );
