import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Dialog from '../index';

describe( 'Dialog', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const actionRef = createRef< HTMLButtonElement >();
		const titleRef = createRef< HTMLHeadingElement >();
		const closeIconRef = createRef< HTMLButtonElement >();
		const footerRef = createRef< HTMLDivElement >();

		render(
			<Dialog.Root>
				<Dialog.Trigger ref={ triggerRef }>Open Dialog</Dialog.Trigger>
				<Dialog.Popup ref={ popupRef }>
					<Dialog.Header>
						<Dialog.Title ref={ titleRef }>
							Test Dialog
						</Dialog.Title>
						<Dialog.CloseIcon ref={ closeIconRef } />
					</Dialog.Header>
					<Dialog.Footer ref={ footerRef }>
						<Dialog.Action ref={ actionRef }>Close</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		// Test trigger ref before interaction
		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		// Click trigger to open dialog
		await user.click( triggerRef.current! );

		// Wait for the dialog to appear
		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		// Now that the dialog is open, verify all inner refs
		expect( titleRef.current ).toBeInstanceOf( HTMLHeadingElement );
		expect( closeIconRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( actionRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( footerRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	describe( 'Development mode validation', () => {
		// Suppress React's error boundary logging for these tests.
		let originalConsoleError: typeof console.error;

		beforeEach( () => {
			// eslint-disable-next-line no-console
			originalConsoleError = console.error;
			// eslint-disable-next-line no-console
			console.error = jest.fn();
		} );

		afterEach( () => {
			// eslint-disable-next-line no-console
			console.error = originalConsoleError;
		} );

		it( 'should throw when Dialog.Title is missing', async () => {
			const user = userEvent.setup();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							{ /* Missing Dialog.Title */ }
						</Dialog.Header>
						<p>Content without a title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			// Open the dialog - this will trigger the error in useEffect
			await expect( async () => {
				await user.click(
					screen.getByRole( 'button', { name: 'Open Dialog' } )
				);
				// Wait for effects to run
				await waitFor( () => {
					// This will throw due to React error boundary
				} );
			} ).rejects.toThrow(
				'Dialog: Missing <Dialog.Title>. ' +
					'For accessibility, every dialog requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);
		} );

		it( 'should not throw when Dialog.Title is present', async () => {
			const user = userEvent.setup();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
						</Dialog.Header>
						<p>Content with a title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			// Open the dialog - should not throw
			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			// Wait for the dialog to appear and validation to run
			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			// Wait a bit more to ensure validation has run without errors
			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );

			// If we got here without throwing, the test passes
			expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		} );
	} );
} );
