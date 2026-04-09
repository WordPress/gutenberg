import { speak } from '@wordpress/a11y';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';

import * as AlertDialog from '..';
import type { ConfirmResult } from '../types';

jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );

function createDeferred() {
	let resolve!: ( value?: ConfirmResult ) => void;
	let reject!: ( reason?: unknown ) => void;
	const promise = new Promise< ConfirmResult >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

describe( 'AlertDialog', () => {
	it( 'forwards ref', () => {
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();

		render(
			<AlertDialog.Root defaultOpen>
				<AlertDialog.Trigger ref={ triggerRef }>
					Open
				</AlertDialog.Trigger>
				<AlertDialog.Popup ref={ popupRef } title="Test Title">
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'renders with title, children, and default buttons', async () => {
		render(
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup title="Test Title">
					Test message content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'Test Title' ) ).toBeVisible();
		} );

		expect( screen.getByText( 'Test message content' ) ).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Close' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'OK' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Cancel' } )
		).toBeVisible();
	} );

	it( 'renders description when provided', async () => {
		render(
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup
					title="Test Title"
					description="This is a description"
				>
					Body content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByText( 'This is a description' ) ).toBeVisible();
		} );
	} );

	it( 'renders with role="alertdialog" for default intent', async () => {
		render(
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup title="Default Dialog">
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
		} );
	} );

	it( 'renders with role="alertdialog" for irreversible intent', async () => {
		render(
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup
					intent="irreversible"
					title="Irreversible Dialog"
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
		} );
	} );

	it( 'uses custom button labels', async () => {
		render(
			<AlertDialog.Root open onOpenChange={ jest.fn() }>
				<AlertDialog.Popup
					title="Custom Labels"
					confirmButtonText="Yes, do it"
					cancelButtonText="No, go back"
				>
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'Yes, do it' } )
			).toBeVisible();
		} );

		expect(
			screen.getByRole( 'button', { name: 'No, go back' } )
		).toBeVisible();
	} );

	it( 'opens dialog when Trigger is clicked', async () => {
		render(
			<AlertDialog.Root>
				<AlertDialog.Trigger>Open</AlertDialog.Trigger>
				<AlertDialog.Popup title="Trigger Test">
					Dialog content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		expect(
			screen.queryByText( 'Dialog content' )
		).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Open' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Trigger Test' ) ).toBeVisible();
		} );

		expect( screen.getByText( 'Dialog content' ) ).toBeVisible();
	} );

	describe( 'sync confirm flow', () => {
		it( 'calls onConfirm and closes on confirm click', async () => {
			const onConfirm = jest.fn();
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ onConfirm }
				>
					<AlertDialog.Popup title="Sync Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			expect( onConfirm ).toHaveBeenCalledTimes( 1 );
			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.objectContaining( {
						reason: 'imperative-action',
					} )
				);
			} );
		} );

		it( 'provides well-formed event details on confirm close', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ jest.fn() }
				>
					<AlertDialog.Popup title="Details Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.objectContaining( {
						reason: 'imperative-action',
					} )
				);
			} );

			const details = onOpenChange.mock.calls.find(
				( [ open ]: [ boolean ] ) => ! open
			)?.[ 1 ];

			expect( details ).toBeDefined();
			expect( typeof details.cancel ).toBe( 'function' );
			expect( typeof details.allowPropagation ).toBe( 'function' );
			expect( typeof details.preventUnmountOnClose ).toBe( 'function' );
			expect( details.event ).toBeInstanceOf( Event );
		} );

		it( 'closes without onConfirm when no handler is provided', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root open onOpenChange={ onOpenChange }>
					<AlertDialog.Popup title="No Handler">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.objectContaining( {
						reason: 'imperative-action',
					} )
				);
			} );
		} );
	} );

	describe( 'cancel and dismiss', () => {
		it( 'closes on cancel click without calling onConfirm', async () => {
			const onConfirm = jest.fn();
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ onConfirm }
				>
					<AlertDialog.Popup title="Cancel Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'Cancel' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Cancel' } )
			);

			expect( onOpenChange ).toHaveBeenCalledWith(
				false,
				expect.objectContaining( { reason: 'close-press' } )
			);
			expect( onConfirm ).not.toHaveBeenCalled();
		} );

		it( 'closes on escape key', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root open onOpenChange={ onOpenChange }>
					<AlertDialog.Popup title="Escape Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( screen.getByText( 'Escape Test' ) ).toBeVisible();
			} );

			await userEvent.keyboard( '{Escape}' );

			expect( onOpenChange ).toHaveBeenCalledWith(
				false,
				expect.objectContaining( { reason: 'escape-key' } )
			);
		} );

		it( 'does not close on backdrop click', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root open onOpenChange={ onOpenChange }>
					<AlertDialog.Popup title="Backdrop Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( screen.getByText( 'Backdrop Test' ) ).toBeVisible();
			} );

			await userEvent.click( document.body );

			expect( onOpenChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'irreversible intent', () => {
		it( 'renders title and buttons', async () => {
			render(
				<AlertDialog.Root open onOpenChange={ jest.fn() }>
					<AlertDialog.Popup
						intent="irreversible"
						title="Irreversible Dialog"
					>
						Irreversible message content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Irreversible Dialog' )
				).toBeVisible();
			} );

			expect(
				screen.getByText( 'Irreversible message content' )
			).toBeVisible();
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).toBeVisible();
		} );

		it( 'closes on escape key', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root open onOpenChange={ onOpenChange }>
					<AlertDialog.Popup
						intent="irreversible"
						title="Irreversible Dialog"
					>
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Irreversible Dialog' )
				).toBeVisible();
			} );

			await userEvent.keyboard( '{Escape}' );

			expect( onOpenChange ).toHaveBeenCalledWith(
				false,
				expect.objectContaining( { reason: 'escape-key' } )
			);
		} );

		it( 'does not close on backdrop click', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root open onOpenChange={ onOpenChange }>
					<AlertDialog.Popup
						intent="irreversible"
						title="Irreversible Dialog"
					>
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Irreversible Dialog' )
				).toBeVisible();
			} );

			await userEvent.click( document.body );

			expect( onOpenChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'async confirm flow', () => {
		it( 'disables buttons while confirm is pending', async () => {
			const deferred = createDeferred();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Async Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toHaveAttribute( 'aria-disabled', 'true' );
			} );

			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).toHaveAttribute( 'aria-disabled', 'true' );

			await act( async () => {
				deferred.resolve();
			} );
		} );

		it( 'closes dialog when async confirm resolves', async () => {
			const deferred = createDeferred();
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Async Resolve">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await act( async () => {
				deferred.resolve();
			} );

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.objectContaining( {
						reason: 'imperative-action',
					} )
				);
			} );
		} );

		it( 're-enables buttons when async confirm rejects (task failure)', async () => {
			const deferred = createDeferred();
			const consoleSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Async Reject">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toHaveAttribute( 'aria-disabled', 'true' );
			} );

			await act( async () => {
				deferred.reject( new Error( 'Task failed' ) );
			} );

			// The error is caught and logged via console.error in Root.
			await waitFor( () => {
				expect( consoleSpy ).toHaveBeenCalledWith(
					expect.objectContaining( { message: 'Task failed' } )
				);
			} );

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );
			} );

			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' );

			expect( screen.getByText( 'Async Reject' ) ).toBeVisible();

			// Throws do NOT render a visible error message.
			expect(
				screen.queryByText( 'Task failed' )
			).not.toBeInTheDocument();

			consoleSpy.mockRestore();
		} );

		it( 'keeps dialog open when confirm returns { close: false }', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ () => ( { close: false } ) }
				>
					<AlertDialog.Popup title="Keep Open">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );
			} );

			expect( onOpenChange ).not.toHaveBeenCalledWith(
				false,
				expect.anything()
			);
			expect( screen.getByText( 'Keep Open' ) ).toBeVisible();
		} );

		it( 'keeps dialog open when async confirm returns { close: false }', async () => {
			const deferred = createDeferred();
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Async Keep Open">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toHaveAttribute( 'aria-disabled', 'true' );
			} );

			await act( async () => {
				deferred.resolve( { close: false } );
			} );

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );
			} );

			expect( onOpenChange ).not.toHaveBeenCalledWith(
				false,
				expect.anything()
			);
		} );

		it( 'blocks dismiss while pending by default', async () => {
			const deferred = createDeferred();
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Block Dismiss">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toHaveAttribute( 'aria-disabled', 'true' );
			} );

			await userEvent.keyboard( '{Escape}' );

			expect( onOpenChange ).not.toHaveBeenCalledWith(
				false,
				expect.anything()
			);

			await act( async () => {
				deferred.resolve();
			} );
		} );

		it( 'ignores duplicate confirm clicks while pending', async () => {
			const onConfirm = jest.fn(
				() =>
					new Promise< void >( () => {
						// Never resolves
					} )
			);

			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ onConfirm }
				>
					<AlertDialog.Popup title="Double Click">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);
			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			expect( onConfirm ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'uncontrolled mode', () => {
		it( 'renders dialog open when defaultOpen is true', async () => {
			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup title="Default Open">
						Dialog content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
			} );
			expect( screen.getByText( 'Default Open' ) ).toBeVisible();
			expect( screen.getByText( 'Dialog content' ) ).toBeVisible();
		} );

		it( 'allows closing and reopening after defaultOpen', async () => {
			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup title="Reopen Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Cancel' } )
			);

			await waitFor( () => {
				expect(
					screen.queryByRole( 'alertdialog' )
				).not.toBeInTheDocument();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Open' } )
			);

			await waitFor( () => {
				expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
			} );
		} );

		it( 'opens and closes via cancel', async () => {
			const onConfirm = jest.fn();

			render(
				<AlertDialog.Root onConfirm={ onConfirm }>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup title="Uncontrolled">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			expect( screen.queryByText( 'Content' ) ).not.toBeInTheDocument();

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Open' } )
			);

			await waitFor( () => {
				expect( screen.getByText( 'Uncontrolled' ) ).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Cancel' } )
			);

			await waitFor( () => {
				expect(
					screen.queryByText( 'Uncontrolled' )
				).not.toBeInTheDocument();
			} );
		} );

		it( 'closes and unmounts dialog via confirm click', async () => {
			const onConfirm = jest.fn();

			render(
				<AlertDialog.Root onConfirm={ onConfirm }>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup title="Uncontrolled Confirm">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Open' } )
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Uncontrolled Confirm' )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			expect( onConfirm ).toHaveBeenCalledTimes( 1 );

			await waitFor( () => {
				expect(
					screen.queryByRole( 'alertdialog' )
				).not.toBeInTheDocument();
			} );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'does not error when unmounted during pending', async () => {
			const deferred = createDeferred();

			const { unmount } = render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Unmount Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toHaveAttribute( 'aria-disabled', 'true' );
			} );

			// Unmount while pending — should not throw
			unmount();

			// Resolve the deferred — should be a no-op after unmount
			await act( async () => {
				deferred.resolve();
			} );
		} );

		it( 'controlled mode: recovers to idle when consumer keeps dialog open after confirm', async () => {
			const onConfirm = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ onConfirm }
				>
					<AlertDialog.Popup title="Deadlock Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			expect( onConfirm ).toHaveBeenCalledTimes( 1 );

			// Consumer passes open={true} and does NOT update it in
			// onOpenChange, so phase would be stuck at 'closing'.
			// The safety-net useEffect should recover phase to 'idle'.
			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );
			} );

			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'recovers when onConfirm throws synchronously', async () => {
			const onConfirm = jest.fn( () => {
				throw new Error( 'Sync error' );
			} );
			const onOpenChange = jest.fn();
			const consoleSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ onConfirm }
				>
					<AlertDialog.Popup title="Throw Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			// The error is caught and logged via console.error in Root.
			await waitFor( () => {
				expect( consoleSpy ).toHaveBeenCalledWith(
					expect.objectContaining( { message: 'Sync error' } )
				);
			} );

			// Dialog stays open and buttons return to idle
			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );
			} );

			expect( onOpenChange ).not.toHaveBeenCalledWith(
				false,
				expect.anything()
			);
			expect( screen.getByText( 'Throw Test' ) ).toBeVisible();

			// Throws do NOT render a visible error message.
			expect(
				screen.queryByText( 'Sync error' )
			).not.toBeInTheDocument();

			consoleSpy.mockRestore();
		} );

		it( 'sets aria-describedby when description is provided', async () => {
			render(
				<AlertDialog.Root open onOpenChange={ jest.fn() }>
					<AlertDialog.Popup
						title="Describedby Test"
						description="A helpful description"
					>
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( screen.getByRole( 'alertdialog' ) ).toBeVisible();
			} );

			const dialog = screen.getByRole( 'alertdialog' );
			expect( dialog ).toHaveAccessibleDescription(
				'A helpful description'
			);
		} );

		it( 'allows re-confirm after { close: false, error }', async () => {
			const deferred = createDeferred();
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Error Retry">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			// First confirm — returns error
			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await act( async () => {
				deferred.resolve( {
					close: false,
					error: 'Validation failed',
				} );
			} );

			await waitFor( () => {
				expect( screen.getByText( 'Validation failed' ) ).toBeVisible();
			} );

			// Buttons are re-enabled, user can retry
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'allows re-confirm after { close: false }', async () => {
			let callCount = 0;
			const onConfirm = jest.fn( (): { close: boolean } | undefined => {
				callCount++;
				if ( callCount === 1 ) {
					return { close: false };
				}
				return undefined;
			} );
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ onConfirm }
				>
					<AlertDialog.Popup title="Retry Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			// First confirm — returns { close: false }
			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );
			} );

			expect( onOpenChange ).not.toHaveBeenCalledWith(
				false,
				expect.anything()
			);

			// Second confirm — returns void → should close
			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.objectContaining( {
						reason: 'imperative-action',
					} )
				);
			} );

			expect( onConfirm ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'error handling', () => {
		beforeEach( () => {
			( speak as jest.Mock ).mockClear();
		} );

		it( 'displays error message when onConfirm returns { close: false, error }', async () => {
			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ () => ( {
						close: false,
						error: 'Something went wrong.',
					} ) }
				>
					<AlertDialog.Popup title="Error Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Something went wrong.' )
				).toBeVisible();
			} );
		} );

		it( 'displays error message from async onConfirm', async () => {
			const deferred = createDeferred();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ () => deferred.promise }
				>
					<AlertDialog.Popup title="Async Error">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await act( async () => {
				deferred.resolve( {
					close: false,
					error: 'Server error occurred.',
				} );
			} );

			await waitFor( () => {
				expect(
					screen.getByText( 'Server error occurred.' )
				).toBeVisible();
			} );

			// Buttons return to idle
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'stays open when error is returned without explicit close: false', async () => {
			const onOpenChange = jest.fn();

			render(
				<AlertDialog.Root
					open
					onOpenChange={ onOpenChange }
					onConfirm={ () => ( { error: 'Implicit stay open.' } ) }
				>
					<AlertDialog.Popup title="Implicit Close">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'Implicit stay open.' )
				).toBeVisible();
			} );

			// Dialog stays open — onOpenChange(false) was not called
			expect( onOpenChange ).not.toHaveBeenCalledWith(
				false,
				expect.anything()
			);
		} );

		it( 'clears error message on next confirm attempt', async () => {
			let callCount = 0;
			const onConfirm = jest.fn( (): ConfirmResult => {
				callCount++;
				if ( callCount === 1 ) {
					return {
						close: false,
						error: 'First attempt failed.',
					};
				}
				return undefined;
			} );

			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ onConfirm }
				>
					<AlertDialog.Popup title="Clear Error">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			// First confirm — shows error
			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.getByText( 'First attempt failed.' )
				).toBeVisible();
			} );

			// Second confirm — error should be cleared
			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect(
					screen.queryByText( 'First attempt failed.' )
				).not.toBeInTheDocument();
			} );
		} );

		it( 'clears error message when dialog reopens', async () => {
			render(
				<AlertDialog.Root
					onConfirm={ () => ( {
						close: false,
						error: 'Persistent error.',
					} ) }
				>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup title="Reopen Clear">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			// Open dialog
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Open' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			// Trigger error
			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect( screen.getByText( 'Persistent error.' ) ).toBeVisible();
			} );

			// Close via cancel
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Cancel' } )
			);

			await waitFor( () => {
				expect(
					screen.queryByRole( 'alertdialog' )
				).not.toBeInTheDocument();
			} );

			// Reopen — error should be gone
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Open' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			expect(
				screen.queryByText( 'Persistent error.' )
			).not.toBeInTheDocument();
		} );

		it( 'announces error message to screen readers via speak()', async () => {
			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ () => ( {
						close: false,
						error: 'Announced error.',
					} ) }
				>
					<AlertDialog.Popup title="Speak Test">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect( speak ).toHaveBeenCalledWith(
					'Announced error.',
					'assertive'
				);
			} );
		} );

		it( 'does not show error message when onConfirm throws', async () => {
			const consoleSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			render(
				<AlertDialog.Root
					open
					onOpenChange={ jest.fn() }
					onConfirm={ () => {
						throw new Error( 'Unhandled throw' );
					} }
				>
					<AlertDialog.Popup title="No Error Display">
						Content
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).toBeVisible();
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'OK' } )
			);

			await waitFor( () => {
				expect( consoleSpy ).toHaveBeenCalledWith(
					expect.objectContaining( { message: 'Unhandled throw' } )
				);
			} );

			// No error message rendered — throws don't trigger the error UI
			expect(
				screen.queryByText( 'Unhandled throw' )
			).not.toBeInTheDocument();
			expect( speak ).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		} );
	} );
} );
