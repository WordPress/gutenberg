/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import _FormFileUpload from '..';

/**
 * Browser dependencies
 */
const { File } = window;

const FormFileUpload = (
	props: React.ComponentProps< typeof _FormFileUpload >
) => <_FormFileUpload __next40pxDefaultSize { ...props } />;

// @testing-library/user-event considers changing <input type="file"> to a string as a change, but it do not occur on real browsers, so the comparisons will be against this result
const fakePath = expect.objectContaining( {
	target: expect.objectContaining( {
		value: 'C:\\fakepath\\hello.png',
	} ),
} );

describe( 'FormFileUpload', () => {
	it( 'should show an Icon Button and a hidden input', () => {
		render(
			<FormFileUpload onChange={ () => {} }>
				My Upload Button
			</FormFileUpload>
		);

		const button = screen.getByText( 'My Upload Button' );
		const input = screen.getByTestId( 'form-file-upload-input' );
		expect( button ).toBeInTheDocument();
		expect( input ).toHaveStyle( 'display: none' );
	} );

	it( 'should not fire a change event after selecting the same file', async () => {
		const user = userEvent.setup();

		const onChange = jest.fn();

		render(
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

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( fakePath );
	} );

	it( 'should fire a change event after selecting the same file if the value was reset in between', async () => {
		const user = userEvent.setup();

		const onChange = jest.fn();

		render(
			<FormFileUpload
				onClick={ jest.fn( ( e ) => ( e.currentTarget.value = '' ) ) }
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
