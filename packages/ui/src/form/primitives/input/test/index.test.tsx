import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Input } from '../index';

describe( 'Input', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLInputElement >();

		render( <Input ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLInputElement );
	} );

	describe( 'data-empty-value', () => {
		it( 'flags an input with an empty controlled value', () => {
			const ref = createRef< HTMLInputElement >();

			render(
				<Input ref={ ref } type="time" value="" onChange={ () => {} } />
			);

			expect( ref.current ).toHaveAttribute( 'data-empty-value' );
		} );

		it( 'does not flag an input with a value', () => {
			const ref = createRef< HTMLInputElement >();

			render(
				<Input
					ref={ ref }
					type="time"
					value="12:30"
					onChange={ () => {} }
				/>
			);

			expect( ref.current ).not.toHaveAttribute( 'data-empty-value' );
		} );

		it( 'does not flag an uncontrolled input', () => {
			const ref = createRef< HTMLInputElement >();

			render( <Input ref={ ref } type="time" /> );

			expect( ref.current ).not.toHaveAttribute( 'data-empty-value' );
		} );
	} );
} );
