/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Modal from '../';

describe( 'Modal', () => {
	it( 'applies the aria-describedby attribute when provided', () => {
		render(
			<Modal aria={ { describedby: 'description-id' } }>
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
			<Modal aria={ { labelledby: 'title-id' } }>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<h1 id="title-id">Test Title</h1>
			</Modal>
		);
		expect( screen.getByRole( 'dialog' ) ).toHaveAttribute(
			'aria-labelledby',
			'title-id'
		);
	} );

	it( 'prefers the aria label of the title prop over the aria.labelledby prop', () => {
		render(
			<Modal title="Test Title" aria={ { labelledby: 'title-id' } }>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<h1 id="title-id">Wrong Title</h1>
			</Modal>
		);
		const dialog = screen.getByRole( 'dialog' );
		const titleId = within( dialog ).getByText( 'Test Title' ).id;
		expect( dialog ).toHaveAttribute( 'aria-labelledby', titleId );
	} );

	it( 'hides the header when the `__experimentalHideHeader` prop is used', () => {
		render(
			<Modal title="Test Title" __experimentalHideHeader>
				<p>Modal content</p>
			</Modal>
		);
		const dialog = screen.getByRole( 'dialog' );
		const title = within( dialog ).queryByText( 'Test Title' );
		expect( title ).not.toBeInTheDocument();
	} );
} );
