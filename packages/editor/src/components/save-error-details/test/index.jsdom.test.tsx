import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import SaveErrorDetails from '../';

vi.mock( import( '@wordpress/a11y' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	speak: vi.fn(),
} ) );

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useCopyToClipboard: vi.fn(),
} ) );

const MESSAGE = 'Updating failed. Please try updating again.';
const DETAIL = 'The post type is invalid.';

describe( 'SaveErrorDetails', () => {
	let copiedText: unknown;
	let notifyCopied: ( () => void ) | undefined;

	beforeEach( () => {
		copiedText = undefined;
		// The clipboard itself is the browser's, so what is asserted here is
		// what the component hands it, and how it reports back.
		vi.mocked( useCopyToClipboard ).mockImplementation(
			( text, onCopy ) => {
				copiedText = text;
				notifyCopied = onCopy;
				return () => undefined;
			}
		);
	} );

	it( 'discloses the detail behind a toggle', async () => {
		const user = userEvent.setup();
		render( <SaveErrorDetails message={ MESSAGE } detail={ DETAIL } /> );

		const toggle = screen.getByRole( 'button', { name: 'Show details' } );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( screen.getByText( DETAIL ) ).not.toBeVisible();

		await user.click( toggle );

		expect( screen.getByText( DETAIL ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Hide details' } )
		).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	it( 'offers copying even when there is no detail to disclose', () => {
		render( <SaveErrorDetails message={ MESSAGE } detail={ null } /> );

		// Every failure is copyable, whether or not the server said more:
		// the message alone is still worth pasting into a search.
		expect(
			screen.getByRole( 'button', { name: 'Copy error' } )
		).toBeVisible();
		expect( copiedText ).toBe( MESSAGE );
		expect(
			screen.queryByRole( 'button', { name: 'Show details' } )
		).not.toBeInTheDocument();
	} );

	it( 'copies the message together with the detail', () => {
		render( <SaveErrorDetails message={ MESSAGE } detail={ DETAIL } /> );

		expect(
			screen.getByRole( 'button', { name: 'Copy error' } )
		).toBeVisible();
		expect( copiedText ).toBe( `${ MESSAGE }\n\n${ DETAIL }` );
	} );

	it( 'confirms the copy without renaming the button', () => {
		vi.useFakeTimers();

		render( <SaveErrorDetails message={ MESSAGE } detail={ DETAIL } /> );

		const button = screen.getByRole( 'button', { name: 'Copy error' } );

		// The click is the clipboard hook's to handle, through the ref it puts
		// on the button, so a copy is reported the way the hook reports one.
		act( () => notifyCopied?.() );

		// The button keeps focus after a copy, and renaming the focused
		// element is announced inconsistently, so the name has to stay put.
		expect( button ).toHaveAccessibleName( 'Copy error' );
		expect( speak ).toHaveBeenCalledWith( 'Error copied to clipboard.' );

		act( () => vi.advanceTimersByTime( 3000 ) );

		expect( button ).toHaveAccessibleName( 'Copy error' );

		vi.useRealTimers();
	} );
} );
