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

		it( 'should not render if closed by clicking `OK`, and callback should be called', async () => {
			const onConfirm = jest.fn().mockName('onConfirm()');

			const wrapper = render(
				<Confirm onConfirm={ onConfirm } />
			);

			const button = await wrapper.findByText( 'OK' );

			fireEvent.click( button );

			expect(onConfirm).toHaveBeenCalled();
			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if closed by clicking `Cancel`, and callback should be called', async () => {
			const onCancel = jest.fn().mockName('onCancel()');

			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ onCancel } />
			);

			const button = await wrapper.findByText( 'Cancel' );

			fireEvent.click( button );

			expect( onCancel ).toHaveBeenCalled();
			expect( wrapper ).toMatchSnapshot();
		} );

		it('should be dismissable even if an `onCancel` callback is not provided', async () => {
			const wrapper = render(
				<Confirm onConfirm={ noop } />
			);

			const button = await wrapper.findByText( 'Cancel' );

			fireEvent.click( button );

			expect( wrapper ).toMatchSnapshot();

		});

		it('should not render if `isOpen` is set to false', async () => {
			const wrapper = render(
				<Confirm isOpen={ false } />
			);

			expect( wrapper ).toMatchSnapshot();
		});

		it( 'should not render if dialog is closed by clicking the overlay, and the `onCancel` callback should be called', async () => {
			const onCancel = jest.fn().mockName('onCancel()');

			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ onCancel } />
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
			const onCancel = jest.fn().mockName('onCancel()');

			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ onCancel } />
			);

			const button = await wrapper.findByLabelText( 'Cancel' );

			fireEvent.click( button );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should not render if dialog is closed by pressing `Escape`, and the `onCancel` callback should be called', async () => {
			const onCancel = jest.fn().mockName('onCancel()');

			const wrapper = render(
				<Confirm onConfirm={ noop } onCancel={ onCancel } />
			);

			const frame = wrapper.baseElement.querySelector(
				'.components-modal__frame'
			);

			fireEvent.keyDown( frame, { keyCode: 27 } );

			expect( onCancel ).toHaveBeenCalled();
			expect( wrapper ).toMatchSnapshot();
		} );
	} );
	// @todo test that <enter> closes and calls onConfirm callback
} );
