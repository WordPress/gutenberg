/**
 * External dependencies
 */
import { render as RTLrender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import FormFileUpload from '../';

/**
 * Browser dependencies
 */
const { File } = window;

function render( jsx ) {
	return {
		user: userEvent.setup( {
			// Avoids timeout errors (https://github.com/testing-library/user-event/issues/565#issuecomment-1064579531).
			delay: null,
		} ),
		...RTLrender( jsx ),
	};
}

describe( 'FormFileUpload', () => {
	it( 'should show an Icon Button and a hidden input', () => {
		render( <FormFileUpload>My Upload Button</FormFileUpload> );

		const button = screen.getByText( 'My Upload Button' );
		const input = screen.getByTestId( 'form-file-upload-input' );
		expect( button ).toBeInTheDocument();
		expect( input.style.display ).toBe( 'none' );
	} );

	it( 'should not fire a change event after selecting the same file', async () => {
		const onChange = jest.fn();

		const { user } = render(
			<FormFileUpload onChange={ onChange }>
				My Upload Button
			</FormFileUpload>
		);

		const file = new File( [ 'hello' ], 'hello.png', {
			type: 'image/png',
		} );

		const input = screen.getByTestId( 'form-file-upload-input' );

		await user.upload( input, file );

		// await last upload event propagation
		setTimeout( async () => {
			await user.upload( input, file );

			expect( onChange ).toHaveBeenCalledTimes( 1 );
		}, 0 );
	} );

	it( 'should fire a change event after selecting the same file if there is a onClick', async () => {
		const onChange = jest.fn();

		const { user } = render(
			<FormFileUpload onClick={ jest.fn() } onChange={ onChange }>
				My Upload Button
			</FormFileUpload>
		);

		const file = new File( [ 'hello' ], 'hello.png', {
			type: 'image/png',
		} );

		const input = screen.getByTestId( 'form-file-upload-input' );
		await user.upload( input, file );

		expect( onChange ).toHaveBeenCalledTimes( 1 );

		// await last upload event propagation and onClick event run
		setTimeout( async () => {
			await user.upload( input, file );

			expect( onChange ).toHaveBeenCalledTimes( 2 );
		}, 0 );
	} );
} );
