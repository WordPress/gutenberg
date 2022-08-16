/**
 * External dependencies
 */
import {
	render,
	screen,
	fireEvent,
	waitForElementToBeRemoved,
} from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ConfirmDialog } from '..';

const noop = () => {};

describe( 'Confirm', () => {
	describe( 'Confirm component', () => {
		describe( 'Structure', () => {
			it( 'should render correctly', () => {
				render(
					<ConfirmDialog onConfirm={ noop } onCancel={ noop }>
						Are you sure?
					</ConfirmDialog>
				);

				const dialog = screen.getByRole( 'dialog' );
				const elementsTexts = [ 'Are you sure?', 'OK', 'Cancel' ];

				expect( dialog ).toBeInTheDocument();

				elementsTexts.forEach( ( txt ) => {
					const el = screen.getByText( txt );
					expect( el ).toBeInTheDocument();
				} );
			} );
			it( 'should render correctly with custom button labels', () => {
				const cancelButtonText = 'No thanks';
				const confirmButtonText = 'Yes please!';
				render(
					<ConfirmDialog
						onConfirm={ noop }
						onCancel={ noop }
						cancelButtonText={ cancelButtonText }
						confirmButtonText={ confirmButtonText }
					>
						Are you sure?
					</ConfirmDialog>
				);

				const dialog = screen.getByRole( 'dialog' );
				const elementsTexts = [ confirmButtonText, cancelButtonText ];

				expect( dialog ).toBeInTheDocument();
				expect(
					screen.getByText( 'Are you sure?' )
				).toBeInTheDocument();

				elementsTexts.forEach( ( txt ) => {
					const el = screen.getByRole( 'button', { name: txt } );
					expect( el ).toBeInTheDocument();
				} );
			} );
		} );

		describe( 'When uncontrolled', () => {
			it( 'should render', () => {
				render(
					<ConfirmDialog onConfirm={ noop } onCancel={ noop }>
						Are you sure?
					</ConfirmDialog>
				);

				const confirmDialog = screen.getByRole( 'dialog' );

				expect( confirmDialog ).toBeInTheDocument();
			} );

			it( 'should not render if closed by clicking `OK`, and the `onConfirm` callback should be called', async () => {
				const onConfirm = jest.fn().mockName( 'onConfirm()' );

				render(
					<ConfirmDialog onConfirm={ onConfirm }>
						Are you sure?
					</ConfirmDialog>
				);

				const confirmDialog = screen.getByRole( 'dialog' );
				const button = screen.getByText( 'OK' );

				fireEvent.click( button );

				expect( confirmDialog ).not.toBeInTheDocument();
				expect( onConfirm ).toHaveBeenCalled();
			} );

			it( 'should not render if closed by clicking `Cancel`, and the `onCancel` callback should be called', async () => {
				const onCancel = jest.fn().mockName( 'onCancel()' );

				render(
					<ConfirmDialog onConfirm={ noop } onCancel={ onCancel }>
						Are you sure?
					</ConfirmDialog>
				);

				const confirmDialog = screen.getByRole( 'dialog' );
				const button = screen.getByText( 'Cancel' );

				fireEvent.click( button );

				expect( confirmDialog ).not.toBeInTheDocument();
				expect( onCancel ).toHaveBeenCalled();
			} );

			it( 'should be dismissable even if an `onCancel` callback is not provided', async () => {
				render(
					<ConfirmDialog onConfirm={ noop }>
						Are you sure?
					</ConfirmDialog>
				);

				const confirmDialog = screen.getByRole( 'dialog' );
				const button = screen.getByText( 'Cancel' );

				fireEvent.click( button );

				expect( confirmDialog ).not.toBeInTheDocument();
			} );

			it( 'should not render if dialog is closed by clicking the overlay, and the `onCancel` callback should be called', async () => {
				const onCancel = jest.fn().mockName( 'onCancel()' );

				render(
					<ConfirmDialog onConfirm={ noop } onCancel={ onCancel }>
						Are you sure?
					</ConfirmDialog>
				);

				const confirmDialog = screen.getByRole( 'dialog' );

				//The overlay click is handled by detecting an onBlur from the modal frame.
				fireEvent.blur( confirmDialog );

				await waitForElementToBeRemoved( confirmDialog );

				expect( confirmDialog ).not.toBeInTheDocument();
				expect( onCancel ).toHaveBeenCalled();
			} );

			it( 'should not render if dialog is closed by pressing `Escape`, and the `onCancel` callback should be called', async () => {
				const onCancel = jest.fn().mockName( 'onCancel()' );

				render(
					<ConfirmDialog onConfirm={ noop } onCancel={ onCancel }>
						Are you sure?
					</ConfirmDialog>
				);

				const confirmDialog = screen.getByRole( 'dialog' );

				fireEvent.keyDown( confirmDialog, { keyCode: 27 } );

				expect( confirmDialog ).not.toBeInTheDocument();
				expect( onCancel ).toHaveBeenCalled();
			} );

			it( 'should not render if dialog is closed by pressing `Enter`, and the `onConfirm` callback should be called', async () => {
				const onConfirm = jest.fn().mockName( 'onConfirm()' );

				render(
					<ConfirmDialog onConfirm={ onConfirm }>
						Are you sure?
					</ConfirmDialog>
				);

				const confirmDialog = screen.getByRole( 'dialog' );

				fireEvent.keyDown( confirmDialog, { keyCode: 13 } );

				expect( confirmDialog ).not.toBeInTheDocument();
				expect( onConfirm ).toHaveBeenCalled();
			} );
		} );
	} );

	describe( 'When controlled (isOpen is not `undefined`)', () => {
		it( 'should render when `isOpen` is set to `true`', async () => {
			render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ noop }
					onCancel={ noop }
				>
					Are you sure?
				</ConfirmDialog>
			);

			const confirmDialog = screen.getByRole( 'dialog' );

			expect( confirmDialog ).toBeInTheDocument();
		} );

		it( 'should not render if `isOpen` is set to false', async () => {
			render(
				<ConfirmDialog
					isOpen={ false }
					onConfirm={ noop }
					onCancel={ noop }
				>
					Are you sure?
				</ConfirmDialog>
			);

			// `queryByRole` needs to be used here because in this scenario the
			// dialog is never rendered.
			const confirmDialog = screen.queryByRole( 'dialog' );

			expect( confirmDialog ).not.toBeInTheDocument();
		} );

		it( 'should call the `onConfirm` callback if `OK`', async () => {
			const onConfirm = jest.fn().mockName( 'onConfirm()' );

			render(
				<ConfirmDialog isOpen={ true } onConfirm={ onConfirm }>
					Are you sure?
				</ConfirmDialog>
			);

			const button = screen.getByText( 'OK' );

			fireEvent.click( button );

			expect( onConfirm ).toHaveBeenCalled();
		} );

		it( 'should call the `onCancel` callback if `Cancel` is clicked', async () => {
			const onCancel = jest.fn().mockName( 'onCancel()' );

			render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ noop }
					onCancel={ onCancel }
				>
					Are you sure?
				</ConfirmDialog>
			);

			const button = screen.getByText( 'Cancel' );

			fireEvent.click( button );

			expect( onCancel ).toHaveBeenCalled();
		} );

		it( 'should call the `onCancel` callback if the overlay is clicked', async () => {
			jest.useFakeTimers();

			const onCancel = jest.fn().mockName( 'onCancel()' );

			const wrapper = render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ noop }
					onCancel={ onCancel }
				>
					Are you sure?
				</ConfirmDialog>
			);

			const frame = wrapper.baseElement.querySelector(
				'.components-modal__frame'
			);

			//The overlay click is handled by detecting an onBlur from the modal frame.
			fireEvent.blur( frame );

			// We don't wait for a DOM side effect here, so we need to fake the timers
			// and "advance" it so that the `queueBlurCheck` in the `useFocusOutside` hook
			// properly executes its timeout task.
			jest.advanceTimersByTime( 0 );

			expect( onCancel ).toHaveBeenCalled();

			jest.useRealTimers();
		} );

		it( 'should call the `onCancel` callback if the `Escape` key is pressed', async () => {
			const onCancel = jest.fn().mockName( 'onCancel()' );

			const wrapper = render(
				<ConfirmDialog onConfirm={ noop } onCancel={ onCancel }>
					Are you sure?
				</ConfirmDialog>
			);

			const frame = wrapper.baseElement.querySelector(
				'.components-modal__frame'
			);

			fireEvent.keyDown( frame, { keyCode: 27 } );

			expect( onCancel ).toHaveBeenCalled();
		} );

		it( 'should call the `onConfirm` callback if the `Enter` key is pressed', async () => {
			const onConfirm = jest.fn().mockName( 'onConfirm()' );

			const wrapper = render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ onConfirm }
					onCancel={ noop }
				>
					Are you sure?
				</ConfirmDialog>
			);

			const frame = wrapper.baseElement.querySelector(
				'.components-modal__frame'
			);

			fireEvent.keyDown( frame, { keyCode: 13 } );

			expect( onConfirm ).toHaveBeenCalled();
		} );
	} );
} );
