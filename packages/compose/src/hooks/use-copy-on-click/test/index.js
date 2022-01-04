/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useCopyOnClick from '../';

const ExampleComponent = ( { text, ...props } ) => {
	const ref = useRef();

	const hasCopied = useCopyOnClick( ref, text, 1000 );

	return (
		<button ref={ ref } { ...props }>
			{ hasCopied ? 'Copied' : 'Click to copy' }
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

describe( 'useCopyOnClick', () => {
	beforeEach( () => {
		clipboardValue = undefined;
	} );

	afterAll( () => {
		global.navigator.clipboard = originalClipboard;
	} );

	it( 'should copy the text to the clipboard and display a warning notice', async () => {
		const textToBeCopied = 'mango';
		render( <ExampleComponent text={ textToBeCopied } /> );

		expect( console ).toHaveWarned();

		const triggerButton = screen.getByText( 'Click to copy' );
		fireEvent.click( triggerButton );

		await waitFor( () =>
			expect( clipboardValue ).toEqual( textToBeCopied )
		);

		// Check that the displayed text changes as a way of testing
		// the `hasCopied` logic
		expect( screen.getByText( 'Copied' ) ).toBeInTheDocument();
		await waitFor( () =>
			expect( screen.getByText( 'Click to copy' ) ).toBeInTheDocument()
		);
	} );
} );
