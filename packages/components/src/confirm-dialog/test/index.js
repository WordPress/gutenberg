/**
 * External dependencies
 */
import {
	render,
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
		describe( 'When uncontrolled', () => {
			it( 'should render correctly', () => {
				const wrapper = render(
					<ConfirmDialog onConfirm={ noop } onCancel={ noop } />
				);

				expect( wrapper ).toMatchSnapshot();
			} );

			it( 'should not render if closed by clicking `OK`, and callback should be called', async () => {
				const onConfirm = jest.fn().mockName( 'onConfirm()' );

				const wrapper = render(
					<ConfirmDialog onConfirm={ onConfirm } />
				);

				const button = await wrapper.findByText( 'OK' );

				fireEvent.click( button );

				expect( onConfirm ).toHaveBeenCalled();
				expect( wrapper ).toMatchSnapshot();
			} );

			it( 'should not render if closed by clicking `Cancel`, and callback should be called', async () => {
				const onCancel = jest.fn().mockName( 'onCancel()' );

				const wrapper = render(
					<ConfirmDialog onConfirm={ noop } onCancel={ onCancel } />
				);

				const button = await wrapper.findByText( 'Cancel' );

				fireEvent.click( button );

				expect( onCancel ).toHaveBeenCalled();
				expect( wrapper ).toMatchSnapshot();
			} );

			it( 'should be dismissable even if an `onCancel` callback is not provided', async () => {
				const wrapper = render( <ConfirmDialog onConfirm={ noop } /> );

				const button = await wrapper.findByText( 'Cancel' );

				fireEvent.click( button );

				expect( wrapper ).toMatchSnapshot();
			} );

			it( 'should not render if dialog is closed by clicking the overlay, and the `onCancel` callback should be called', async () => {
				const onCancel = jest.fn().mockName( 'onCancel()' );

				const wrapper = render(
					<ConfirmDialog onConfirm={ noop } onCancel={ onCancel } />
				);

				const frame = wrapper.baseElement.querySelector(
					'.components-modal__frame'
				);

				//The overlay click is handled by detecting an onBlur from the modal frame.
				fireEvent.blur( frame );

				await waitForElementToBeRemoved( frame );

				expect( onCancel ).toHaveBeenCalled();
				expect( wrapper ).toMatchSnapshot();
			} );

			it( 'should not render if dialog is closed by clicking the `x` button, and the `onCancel` callback should be called', async () => {
				const onCancel = jest.fn().mockName( 'onCancel()' );

				const wrapper = render(
					<ConfirmDialog onConfirm={ noop } onCancel={ onCancel } />
				);

				const button = await wrapper.findByLabelText( 'Cancel' );

				fireEvent.click( button );

				expect( wrapper ).toMatchSnapshot();
			} );

			it( 'should not render if dialog is closed by pressing `Escape`, and the `onCancel` callback should be called', async () => {
				const onCancel = jest.fn().mockName( 'onCancel()' );

				const wrapper = render(
					<ConfirmDialog onConfirm={ noop } onCancel={ onCancel } />
				);

				const frame = wrapper.baseElement.querySelector(
					'.components-modal__frame'
				);

				fireEvent.keyDown( frame, { keyCode: 27 } );

				expect( onCancel ).toHaveBeenCalled();
				expect( wrapper ).toMatchSnapshot();
			} );

			it( 'should not render if dialog is closed by pressing `Enter`, and the `onConfirm` callback should be called', async () => {
				const onConfirm = jest.fn().mockName( 'onConfirm()' );

				const wrapper = render(
					<ConfirmDialog onConfirm={ onConfirm } />
				);

				const frame = wrapper.baseElement.querySelector(
					'.components-modal__frame'
				);

				fireEvent.keyDown( frame, { keyCode: 13 } );

				expect( onConfirm ).toHaveBeenCalled();
				expect( wrapper ).toMatchSnapshot();
			} );
		} );
	} );

	describe( 'When controlled (isOpen is not `undefined`)', () => {
		it( 'should render correctly when `isOpen` is set to `true`', async () => {
			const wrapper = render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ noop }
					onCancel={ noop }
				/>
			);

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if `isOpen` is set to false', async () => {
			const wrapper = render(
				<ConfirmDialog
					isOpen={ false }
					onConfirm={ noop }
					onCancel={ noop }
				/>
			);

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should call the `onConfirm` callback if `OK`', async () => {
			const onConfirm = jest.fn().mockName( 'onConfirm()' );

			const wrapper = render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ onConfirm }
				/>
			);

			const button = await wrapper.findByText( 'OK' );

			fireEvent.click( button );

			expect( onConfirm ).toHaveBeenCalled();
		} );

		it( 'should call the `onCancel` callback if `Cancel` is clicked', async () => {
			const onCancel = jest.fn().mockName( 'onCancel()' );

			const wrapper = render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ noop }
					onCancel={ onCancel }
				/>
			);

			const button = await wrapper.findByText( 'Cancel' );

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
				/>
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

		it( 'should call the `onCancel` callback if the `x` button is clicked', async () => {
			const onCancel = jest.fn().mockName( 'onCancel()' );

			const wrapper = render(
				<ConfirmDialog
					isOpen={ true }
					onConfirm={ noop }
					onCancel={ onCancel }
				/>
			);

			const button = await wrapper.findByLabelText( 'Cancel' );

			fireEvent.click( button );

			expect( onCancel ).toHaveBeenCalled();
		} );

		it( 'should call the `onCancel` callback if the `Escape` key is pressed', async () => {
			const onCancel = jest.fn().mockName( 'onCancel()' );

			const wrapper = render(
				<ConfirmDialog onConfirm={ noop } onCancel={ onCancel } />
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
				/>
			);

			const frame = wrapper.baseElement.querySelector(
				'.components-modal__frame'
			);

			fireEvent.keyDown( frame, { keyCode: 13 } );

			expect( onConfirm ).toHaveBeenCalled();
		} );
	} );
} );
