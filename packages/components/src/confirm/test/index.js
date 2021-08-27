// TBD

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
import { Confirm } from '..';

const noop = () => {};

describe( 'Confirm', () => {
	describe( 'Confirm component', () => {
		it( 'should render correctly', () => {
			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ noop } />
			);

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if closed by clicking OK', async () => {
			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ noop } />
			);

			const button = await wrapper.findByText( 'OK' );

			fireEvent.click( button );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if closed by clicking cancel', async () => {
			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ noop } />
			);

			const button = await wrapper.findByText( 'Cancel' );

			fireEvent.click( button );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if dialog is closed by clicking the `x` button', async () => {
			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ noop } />
			);

			const button = await wrapper.findByLabelText( 'Close dialog' );

			fireEvent.click( button );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if dialog is closed by clicking the overlay', async () => {
			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ noop } />
			);

			const frame = wrapper.baseElement.querySelector(
				'.components-modal__frame.components-confirm'
			);
			/**
			 * The overlay click is handled by detecting an onBlur from the modal frame.
			 * See the `handeFocusOutside` function in the `ModalFrame` component
			 * and the `withFocusOutside` HOC for moret details.
			 */
			fireEvent.blur( frame );

			await waitForElementToBeRemoved( frame );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if dialog is closed by pressing Escape', async () => {
			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ noop } />
			);

			const frame = wrapper.baseElement.querySelector(
				'.components-modal__frame.components-confirm'
			);

			fireEvent.keyDown( frame, { keyCode: 27 } );

			expect( wrapper ).toMatchSnapshot();
		} );

		it.skip( 'should call the confirm callback upon confirming', () => {} );
		it.skip( 'should call the cancel callback upon confirming', () => {} );
	} );

	/**
	 * Confirm provides a `confirm` helper function that provides an interface
	 * that's closer to the default native `confirm`, returning a boolean and
	 * that can called outside of the component's render function.
	 */
	describe( 'Self-contained rendering using `confirm`', () => {} );
} );
