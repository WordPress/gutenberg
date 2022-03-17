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

// @testing-library/user-event considers changing <input type="file"> to a string as a change, but it do not occur on real browsers, so the comparisions will be agains this result
const fakePath = expect.objectContaining( {
	target: expect.objectContaining( {
		value: 'C:\\fakepath\\hello.png',
	} ),
} );

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

		await user.upload( input, file );

		expect( onChange ).toHaveBeenNthCalledWith( 1, fakePath );
	} );

	it( 'should fire a change event after selecting the same file if there is a onClick', async () => {
		const onChange = jest.fn();

		const { user } = render(
			<FormFileUpload
				onClick={ jest.fn( ( e ) => ( e.target.value = '' ) ) }
				onChange={ onChange }
			>
				My Upload Button
			</FormFileUpload>
		);

		const file = new File( [ 'hello' ], 'hello.png', {
			type: 'image/png',
		} );

		const input = screen.getByTestId( 'form-file-upload-input' );
		await user.upload( input, file );

		expect( onChange ).toHaveBeenNthCalledWith( 1, fakePath );

		await user.upload( input, file );

		expect( onChange ).toHaveBeenNthCalledWith( 2, fakePath );
	} );
} );
