/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import FormFileUpload from '../';

describe( 'FormFileUpload', () => {
	it( 'should show an Icon Button and a hidden input', () => {
		render( <FormFileUpload>My Upload Button</FormFileUpload> );

		const button = screen.getByText( 'My Upload Button' );
		const input = screen.getByTestId( 'input' );
		expect( button ).toBeInTheDocument();
		expect( input.style.display ).toBe( 'none' );
	} );

	it( 'should not fire a change event after selecting the same file', () => {
		const onChange = jest.fn();

		render(
			<FormFileUpload onChange={ onChange }>
				My Upload Button
			</FormFileUpload>
		);

		// eslint-disable-next-line no-undef
		const file = new File( [ 'hello' ], 'hello.png', {
			type: 'image/png',
		} );

		const input = screen.getByTestId( 'input' );

		userEvent.upload( input, file );

		// await last upload event propagation
		setTimeout( () => {
			userEvent.upload( input, file );

			expect( onChange ).toHaveBeenCalledTimes( 1 );
		}, 0 );
	} );

	it( 'should fire a change event after selecting the same file if event.target.value is nulled on click', () => {
		const onChange = jest.fn();

		render(
			<FormFileUpload
				onClick={ ( e ) => ( e.target.value = null ) }
				onChange={ onChange }
			>
				My Upload Button
			</FormFileUpload>
		);

		// eslint-disable-next-line no-undef
		const file = new File( [ 'hello' ], 'hello.png', {
			type: 'image/png',
		} );

		const input = screen.getByTestId( 'input' );
		userEvent.upload( input, file );

		expect( onChange ).toHaveBeenCalledTimes( 1 );

		// await last upload event propagation and onClick event run
		setTimeout( () => {
			userEvent.upload( input, file );

			expect( onChange ).toHaveBeenCalledTimes( 2 );
		}, 0 );
	} );
} );
