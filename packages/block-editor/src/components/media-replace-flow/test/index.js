/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

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

function setUpMediaReplaceFlow() {
	const { container } = render( <TestWrapper /> );
	return container;
}

describe( 'General media replace flow', () => {
	it( 'renders successfully', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );

		expect( mediaReplaceButton ).toBeVisible();
	} );

	it( 'renders replace menu', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );
		mediaReplaceButton.click();

		const uploadMenu = screen.getByRole( 'menu' );

		expect( uploadMenu ).toBeInTheDocument();
		expect( uploadMenu ).not.toBeVisible();
	} );

	it( 'displays media URL', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );

		mediaReplaceButton.click();

		const mediaURL = screen.getByRole( 'link', {
			name: 'example.media (opens in a new tab)',
		} );

		expect( mediaURL ).toHaveAttribute( 'href', 'https://example.media' );
	} );

	it( 'edits media URL', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = screen.getByRole( 'button', {
			expanded: false,
		} );

		mediaReplaceButton.click();

		const editMediaURL = screen.getByRole( 'button', {
			name: 'Edit',
		} );

		editMediaURL.click();

		const mediaURLInput = screen.getByRole( 'combobox', {
			name: 'URL',
			expanded: false,
		} );

		fireEvent.change( mediaURLInput, {
			target: { value: 'https://new.example.media' },
		} );

		const saveMediaURLButton = screen.getByRole( 'button', {
			name: 'Submit',
		} );

		saveMediaURLButton.click();

		const mediaURL = screen.getByRole( 'link', {
			name: 'new.example.media (opens in a new tab)',
		} );

		expect( mediaURL ).toHaveAttribute(
			'href',
			'https://new.example.media'
		);
	} );
} );
