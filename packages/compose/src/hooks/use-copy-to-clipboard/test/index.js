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

	it( 'should clear any selected text', async () => {
		const paragraphText = 'Text to highlight';
		const textToBeCopied = 'apple';
		render(
			<>
				<p data-testid="paragraph">{ paragraphText }</p>
				<ExampleComponent text={ textToBeCopied } />
			</>
		);

		// Programmatically select the paragraph's text
		const paragraph = screen.getByTestId( 'paragraph' );
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents( paragraph );
		selection.removeAllRanges();
		selection.addRange( range );

		// Make sure the text in the paragraph is being selected.
		expect( window.getSelection().toString() ).toEqual( paragraphText );

		const triggerButton = screen.getByText( 'Click to copy' );
		fireEvent.click( triggerButton );

		// Check that the selection has been cleared.
		await waitFor( () =>
			expect( window.getSelection().toString() ).toEqual( '' )
		);
		expect( clipboardValue ).toEqual( textToBeCopied );
	} );

	it( 'should restore focus on the trigger element', async () => {
		const textToBeCopied = 'watermelon';
		render(
			<>
				<button>Focus me</button>
				<ExampleComponent text={ textToBeCopied } />
			</>
		);

		// Programmatically focus the first button
		const firstButton = screen.getByText( 'Focus me' );
		firstButton.focus();

		// Check that the focus is on the first button
		expect( firstButton ).toHaveFocus();

		const triggerButton = screen.getByText( 'Click to copy' );
		fireEvent.click( triggerButton );

		// Check that the focus is on the trigger button
		await waitFor( () =>
			expect( clipboardValue ).toEqual( textToBeCopied )
		);
		expect( triggerButton ).toHaveFocus();
	} );
} );
