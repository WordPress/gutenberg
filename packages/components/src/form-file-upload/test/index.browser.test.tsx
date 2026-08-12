import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import FormFileUpload from '..';
const { File } = window;

// Browsers expose the selected local file through a fake path on the event target.
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
		expect( getComputedStyle( input ).display ).toBe( 'none' );
	} );

	it( 'should fire a change event after selecting a file', async () => {
		const user = userEvent.setup();

		const onChange = vi.fn();

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

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( fakePath );
	} );

	it( 'should fire a change event after selecting the same file if the value was reset in between', async () => {
		const user = userEvent.setup();

		const onChange = vi.fn();

		render(
			<FormFileUpload
				onClick={ vi.fn( ( e ) => ( e.currentTarget.value = '' ) ) }
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
