import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormFileUpload from '..';

describe( 'FormFileUpload native file selection', () => {
	it( 'should not fire a change event after selecting the same file', async () => {
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
		await user.upload( input, file );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
	} );
} );
