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
		render( <TestWrapper /> );

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );

		expect( mediaReplaceButton ).toBeVisible();
	} );

	it( 'renders replace menu', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestWrapper /> );

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );

		await user.click( mediaReplaceButton );

		const uploadMenu = screen.getByRole( 'menu' );

		expect( uploadMenu ).toBeInTheDocument();
		expect( uploadMenu ).not.toBeVisible();
	} );

	it( 'displays media URL', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestWrapper /> );

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );

		await user.click( mediaReplaceButton );

		const mediaURL = screen.getByRole( 'link', {
			name: 'example.media (opens in a new tab)',
		} );

		expect( mediaURL ).toHaveAttribute( 'href', 'https://example.media' );
	} );

	it( 'edits media URL', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestWrapper /> );

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );

		await user.click( mediaReplaceButton );

		const editMediaURL = screen.getByRole( 'button', {
			name: 'Edit',
		} );

		await user.click( editMediaURL );

		const mediaURLInput = screen.getByRole( 'combobox', {
			name: 'URL',
			expanded: false,
		} );

		await user.clear( mediaURLInput );
		await user.type( mediaURLInput, 'https://new.example.media' );

		const saveMediaURLButton = screen.getByRole( 'button', {
			name: 'Submit',
		} );

		await user.click( saveMediaURLButton );

		const mediaURL = screen.getByRole( 'link', {
			name: 'new.example.media (opens in a new tab)',
		} );

		expect( mediaURL ).toHaveAttribute(
			'href',
			'https://new.example.media'
		);
	} );
} );
