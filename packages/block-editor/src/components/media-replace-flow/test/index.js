/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MediaReplaceFlow from '../';

const noop = () => {};

function TestWrapper() {
	const [ mediaURL, setMediaURL ] = useState( 'https://example.media' );
	return (
		<MediaReplaceFlow
			mediaId={ 1 }
			mediaURL={ mediaURL }
			allowedTypes={ [ 'png' ] }
			accept="image/*"
			onSelect={ noop }
			onSelectURL={ setMediaURL }
			onError={ noop }
			onCloseModal={ noop }
		/>
	);
}

/**
 * Returns the first found popover element up the DOM tree.
 *
 * @param {HTMLElement} element Element to start with.
 * @return {HTMLElement|null} Popover element, or `null` if not found.
 */
function getWrappingPopoverElement( element ) {
	return element.closest( '.components-popover' );
}

describe( 'General media replace flow', () => {
	it( 'renders successfully', () => {
		render( <TestWrapper /> );

		expect(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		).toBeVisible();
	} );

	it( 'renders replace menu', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);
		const uploadMenu = screen.getByRole( 'menu' );

		expect( uploadMenu ).toBeInTheDocument();
		expect( uploadMenu ).not.toBeVisible();

		// The popover will be positioned with a slight delay.
		await waitFor( () =>
			expect( getWrappingPopoverElement( uploadMenu ) ).toHaveStyle( {
				top: '13px',
				left: '0',
			} )
		);
	} );

	it( 'displays media URL', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);

		// The popover will be positioned with a slight delay.
		await waitFor( () =>
			expect(
				getWrappingPopoverElement( screen.getByRole( 'menu' ) )
			).toHaveStyle( { top: '13px', left: '0' } )
		);

		expect(
			screen.getByRole( 'link', {
				name: 'example.media (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'https://example.media' );
	} );

	it( 'edits media URL', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);

		// The popover will be positioned with a slight delay.
		await waitFor( () =>
			expect(
				getWrappingPopoverElement( screen.getByRole( 'menu' ) )
			).toHaveStyle( { top: '13px', left: '0' } )
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Edit',
			} )
		);

		const mediaURLInput = screen.getByRole( 'combobox', {
			name: 'URL',
			expanded: false,
		} );

		await user.clear( mediaURLInput );
		await user.type( mediaURLInput, 'https://new.example.media' );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Submit',
			} )
		);

		expect(
			screen.getByRole( 'link', {
				name: 'new.example.media (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'https://new.example.media' );
	} );
} );
