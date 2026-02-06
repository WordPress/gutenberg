import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component, createRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import * as Dialog from '../index';

class TestErrorBoundary extends Component<
	{ children: ReactNode; onError: ( error: Error ) => void },
	{ hasError: boolean }
> {
	constructor( props: {
		children: ReactNode;
		onError: ( error: Error ) => void;
	} ) {
		super( props );
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch( error: Error ) {
		this.props.onError( error );
	}

	render() {
		if ( this.state.hasError ) {
			return null;
		}

		return this.props.children;
	}
}

describe( 'Dialog', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const actionRef = createRef< HTMLButtonElement >();
		const headerRef = createRef< HTMLDivElement >();
		const titleRef = createRef< HTMLHeadingElement >();
		const closeIconRef = createRef< HTMLButtonElement >();
		const footerRef = createRef< HTMLDivElement >();

		render(
			<Dialog.Root>
				<Dialog.Trigger ref={ triggerRef }>Open Dialog</Dialog.Trigger>
				<Dialog.Popup ref={ popupRef }>
					<Dialog.Header ref={ headerRef }>
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
		expect( headerRef.current ).toBeInstanceOf( HTMLDivElement );
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
			const onError = jest.fn();

			render(
				<TestErrorBoundary onError={ onError }>
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
				</TestErrorBoundary>
			);

			// Open the dialog - this will trigger the error in useEffect
			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( onError ).toHaveBeenCalled();
			} );

			expect( onError.mock.calls[ 0 ][ 0 ] ).toBeInstanceOf( Error );
			expect( ( onError.mock.calls[ 0 ][ 0 ] as Error ).message ).toBe(
				'Dialog: Missing <Dialog.Title>. ' +
					'For accessibility, every dialog requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);
		} );

		it( 'should not throw before opening the dialog', async () => {
			const onError = jest.fn();

			render(
				<TestErrorBoundary onError={ onError }>
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
				</TestErrorBoundary>
			);

			// Check that the dialog itself hasn't been rendered in the DOM.
			await expect( screen.findByRole( 'dialog' ) ).rejects.toThrow();

			expect( onError ).not.toHaveBeenCalled();
		} );

		it( 'should not throw when Dialog.Title is present', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();

			render(
				<TestErrorBoundary onError={ onError }>
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
				</TestErrorBoundary>
			);

			// Open the dialog - should not throw
			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			// Wait for the dialog to appear and ensure validation does not trigger errors
			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );
			expect( onError ).not.toHaveBeenCalled();
		} );

		it( 'should throw when Dialog.Title is empty', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();

			render(
				<TestErrorBoundary onError={ onError }>
					<Dialog.Root>
						<Dialog.Trigger>Open Dialog</Dialog.Trigger>
						<Dialog.Popup>
							<Dialog.Header>
								{ /* @ts-expect-error this is just for test purposes */ }
								<Dialog.Title>
									{ /* Empty title */ }
								</Dialog.Title>
							</Dialog.Header>
							<p>Content with empty title</p>
							<Dialog.Footer>
								<Dialog.Action>Close</Dialog.Action>
							</Dialog.Footer>
						</Dialog.Popup>
					</Dialog.Root>
				</TestErrorBoundary>
			);

			// Open the dialog - this will trigger the error
			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( onError ).toHaveBeenCalled();
			} );

			expect( onError.mock.calls[ 0 ][ 0 ] ).toBeInstanceOf( Error );
			expect( ( onError.mock.calls[ 0 ][ 0 ] as Error ).message ).toBe(
				'Dialog: <Dialog.Title> cannot be empty. ' +
					'Provide meaningful text content for the dialog title.'
			);
		} );

		it( 'should throw when Dialog.Title contains only whitespace', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();

			render(
				<TestErrorBoundary onError={ onError }>
					<Dialog.Root>
						<Dialog.Trigger>Open Dialog</Dialog.Trigger>
						<Dialog.Popup>
							<Dialog.Header>
								<Dialog.Title> </Dialog.Title>
							</Dialog.Header>
							<p>Content with whitespace-only title</p>
							<Dialog.Footer>
								<Dialog.Action>Close</Dialog.Action>
							</Dialog.Footer>
						</Dialog.Popup>
					</Dialog.Root>
				</TestErrorBoundary>
			);

			// Open the dialog - this will trigger the error
			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( onError ).toHaveBeenCalled();
			} );

			expect( onError.mock.calls[ 0 ][ 0 ] ).toBeInstanceOf( Error );
			expect( ( onError.mock.calls[ 0 ][ 0 ] as Error ).message ).toBe(
				'Dialog: <Dialog.Title> cannot be empty. ' +
					'Provide meaningful text content for the dialog title.'
			);
		} );

		it( 'should not throw when Dialog.Title contains mixed content with text', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();

			render(
				<TestErrorBoundary onError={ onError }>
					<Dialog.Root>
						<Dialog.Trigger>Open Dialog</Dialog.Trigger>
						<Dialog.Popup>
							<Dialog.Header>
								<Dialog.Title>
									<span aria-hidden="true">🎉</span>
									Settings
								</Dialog.Title>
							</Dialog.Header>
							<p>Content with icon and text title</p>
							<Dialog.Footer>
								<Dialog.Action>Close</Dialog.Action>
							</Dialog.Footer>
						</Dialog.Popup>
					</Dialog.Root>
				</TestErrorBoundary>
			);

			// Open the dialog - should not throw
			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			// Wait for the dialog to appear and ensure validation does not trigger errors
			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );
			expect( onError ).not.toHaveBeenCalled();
		} );
	} );
} );
