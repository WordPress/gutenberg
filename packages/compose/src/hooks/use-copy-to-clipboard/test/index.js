/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useCopyToClipboard from '../';

const ExampleComponent = ( { onSuccess, text, ...props } ) => {
	const ref = useCopyToClipboard( text, onSuccess );

	return (
		<button ref={ ref } { ...props }>
			Click to copy
		</button>
	);
};

let clipboardValue;

const originalClipboard = global.navigator.clipboard;
const mockClipboard = {
	writeText: jest.fn().mockImplementation( ( text ) => {
		return new Promise( ( resolve ) => {
			clipboardValue = text;
			resolve();
		} );
	} ),
};

global.navigator.clipboard = mockClipboard;

describe( 'useCopyToClipboard', () => {
	beforeEach( () => {
		clipboardValue = undefined;
	} );

	afterAll( () => {
		global.navigator.clipboard = originalClipboard;
	} );

	it( 'should copy the text to the clipboard', async () => {
		const successCallback = jest.fn();
		const textToBeCopied = 'mango';
		render(
			<ExampleComponent
				onSuccess={ successCallback }
				text={ textToBeCopied }
			/>
		);

		const triggerButton = screen.getByText( 'Click to copy' );
		fireEvent.click( triggerButton );

		await waitFor( () => expect( successCallback ).toHaveBeenCalled() );
		expect( clipboardValue ).toEqual( textToBeCopied );
	} );
} );
