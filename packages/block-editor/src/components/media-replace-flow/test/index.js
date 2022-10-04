/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

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
		const container = setUpMediaReplaceFlow();

		const mediaReplaceButton = container.querySelector(
			'button[aria-expanded="false"]'
		);

		expect( mediaReplaceButton ).not.toBeNull();
	} );

	it( 'renders replace menu', () => {
		const container = setUpMediaReplaceFlow();

		const mediaReplaceButton = container.querySelector(
			'button[aria-expanded="false"]'
		);
		mediaReplaceButton.click();

		const uploadMenu = container.querySelector(
			'.block-editor-media-replace-flow__media-upload-menu'
		);

		expect( uploadMenu ).not.toBeNull();
	} );

	it( 'displays media URL', () => {
		const container = setUpMediaReplaceFlow();

		const mediaReplaceButton = container.querySelector(
			'button[aria-expanded="false"]'
		);
		mediaReplaceButton.click();

		const mediaURL = container.querySelector( '.components-external-link' );

		expect( mediaURL.href ).toEqual( 'https://example.media/' );
	} );

	it( 'edits media URL', () => {
		const container = setUpMediaReplaceFlow();

		const mediaReplaceButton = container.querySelector(
			'button[aria-expanded="false"]'
		);
		mediaReplaceButton.click();

		const editMediaURL = container.querySelector(
			'.block-editor-link-control__search-item-action'
		);

		editMediaURL.click();

		const mediaURLInput = container.querySelector(
			'.block-editor-url-input__input'
		);

		fireEvent.change( mediaURLInput, {
			target: { value: 'https://new.example.media' },
		} );

		const saveMediaURLButton = container.querySelector(
			'.block-editor-link-control__search-submit'
		);

		saveMediaURLButton.click();

		const mediaURL = container.querySelector( '.components-external-link' );

		expect( mediaURL.href ).toEqual( 'https://new.example.media/' );
	} );
} );
