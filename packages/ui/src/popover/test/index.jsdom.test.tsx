import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Popover from '../index';

function collectUncaughtErrors() {
	const errors: Error[] = [];
	const windowHandler = ( event: ErrorEvent ) => {
		event.preventDefault();
		errors.push( event.error );
	};
	const processHandler = ( error: Error ) => errors.push( error );
	window.addEventListener( 'error', windowHandler );
	process.on( 'uncaughtException', processHandler );
	return {
		errors,
		cleanup: () => {
			window.removeEventListener( 'error', windowHandler );
			process.off( 'uncaughtException', processHandler );
		},
	};
}

describe( 'Popover', () => {
	describe( 'forwards ref', () => {
		it( 'should forward ref on Trigger', () => {
			const ref = createRef< HTMLButtonElement >();
			render(
				<Popover.Root>
					<Popover.Trigger ref={ ref }>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
		} );
	} );

	describe( 'title validation', () => {
		// Suppress console.error from React act() warnings and jsdom
		// unhandled-error logging. Validation errors are caught via
		// collectUncaughtErrors (browser or process error event) instead.
		let originalConsoleError: typeof console.error;

		beforeEach( () => {
			// eslint-disable-next-line no-console
			originalConsoleError = console.error;
			// eslint-disable-next-line no-console
			console.error = vi.fn();
		} );

		afterEach( () => {
			// eslint-disable-next-line no-console
			console.error = originalConsoleError;
		} );

		it( 'should throw when Popover.Title is missing', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>No title here</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Popover: Missing <Popover.Title>. ' +
					'For accessibility, every popover requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should throw when Popover.Title is empty', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title />
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Popover: <Popover.Title> cannot be empty. ' +
					'Provide meaningful text content for the popover title.'
			);

			cleanup();
		} );

		it( 'should not throw when Popover.Title is present', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Valid Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( screen.getByText( 'Valid Title' ) ).toBeVisible();
			} );

			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );

		it( 'should throw when title is removed after mount', async () => {
			const { errors, cleanup } = collectUncaughtErrors();

			const ui = ( showTitle: boolean ) => (
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						{ showTitle && <Popover.Title>My Title</Popover.Title> }
						<p>Content</p>
					</Popover.Popup>
				</Popover.Root>
			);

			const { rerender } = render( ui( true ) );

			// Wait for the popover to render.
			await waitFor( () => {
				expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
			} );

			// Let initial validation settle — no errors expected.
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			// Remove the title via rerender.
			rerender( ui( false ) );

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Popover: Missing <Popover.Title>. ' +
					'For accessibility, every popover requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should recover when title is added back', async () => {
			const { errors, cleanup } = collectUncaughtErrors();

			const ui = ( showTitle: boolean ) => (
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						{ showTitle && <Popover.Title>My Title</Popover.Title> }
						<p>Content</p>
					</Popover.Popup>
				</Popover.Root>
			);

			const { rerender } = render( ui( false ) );

			// Wait for the popover to render.
			await waitFor( () => {
				expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
			} );

			// Initially no title — should error.
			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			const errorCountAfterInitial = errors.length;

			// Add the title back via rerender.
			rerender( ui( true ) );

			// Wait for deferred validation to settle.
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);

			// No new errors should have been thrown.
			expect( errors ).toHaveLength( errorCountAfterInitial );

			cleanup();
		} );
	} );
} );
