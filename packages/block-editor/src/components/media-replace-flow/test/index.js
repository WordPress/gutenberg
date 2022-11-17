/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
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

describe( 'General media replace flow', () => {
	it( 'renders successfully', () => {
		const { unmount } = render( <TestWrapper /> );

		expect(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		).toBeVisible();

		// Unmount the UI synchronously so that any async effects, like the on-mount focus
		// that shows and positions a tooltip, are cancelled right away and never run.
		unmount();
	} );

	it( 'renders replace menu', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		const { unmount } = render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);

		const uploadMenu = screen.getByRole( 'menu' );

		expect( uploadMenu ).toBeInTheDocument();
		expect( uploadMenu ).not.toBeVisible();

		// Unmount the UI synchronously so that any async effects, like the on-mount focus
		// that shows and positions a tooltip, are cancelled right away and never run.
		unmount();
	} );

	it( 'displays media URL', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		const { unmount } = render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);

		expect(
			screen.getByRole( 'link', {
				name: 'example.media (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'https://example.media' );

		// Unmount the UI synchronously so that any async effects, like the on-mount focus
		// that shows and positions a tooltip, are cancelled right away and never run.
		unmount();
	} );

	it( 'edits media URL', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		const { unmount } = render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
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

		// Unmount the UI synchronously so that any async effects, like the on-mount focus
		// that shows and positions a tooltip, are cancelled right away and never run.
		unmount();
	} );
} );
