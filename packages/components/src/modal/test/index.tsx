/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Modal from '../';

const noop = () => {};

describe( 'Modal', () => {
	it( 'applies the aria-describedby attribute when provided', () => {
		render(
			<Modal
				aria={ { describedby: 'description-id' } }
				onRequestClose={ noop }
			>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<p id="description-id">Description</p>
			</Modal>
		);
		expect( screen.getByRole( 'dialog' ) ).toHaveAttribute(
			'aria-describedby',
			'description-id'
		);
	} );

	it( 'applies the aria-labelledby attribute when provided', () => {
		render(
			<Modal aria={ { labelledby: 'title-id' } } onRequestClose={ noop }>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<h1 id="title-id">Modal Title Text</h1>
			</Modal>
		);
		expect( screen.getByRole( 'dialog' ) ).toHaveAccessibleName(
			'Modal Title Text'
		);
	} );

	it( 'prefers the aria label of the title prop over the aria.labelledby prop', () => {
		render(
			<Modal
				title="Modal Title Attribute"
				aria={ { labelledby: 'title-id' } }
				onRequestClose={ noop }
			>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<h1 id="title-id">Modal Title Text</h1>
			</Modal>
		);
		expect( screen.getByRole( 'dialog' ) ).toHaveAccessibleName(
			'Modal Title Attribute'
		);
	} );

	it( 'hides the header when the `__experimentalHideHeader` prop is used', () => {
		render(
			<Modal
				title="Test Title"
				__experimentalHideHeader
				onRequestClose={ noop }
			>
				<p>Modal content</p>
			</Modal>
		);
		const dialog = screen.getByRole( 'dialog' );
		const title = within( dialog ).queryByText( 'Test Title' );
		expect( title ).not.toBeInTheDocument();
	} );

	it( 'should call onRequestClose when the escape key is pressed', async () => {
		const user = userEvent.setup();
		const onRequestClose = jest.fn();
		render(
			<Modal onRequestClose={ onRequestClose }>
				<p>Modal content</p>
			</Modal>
		);
		await user.keyboard( '[Escape]' );
		expect( onRequestClose ).toHaveBeenCalled();
	} );
} );
