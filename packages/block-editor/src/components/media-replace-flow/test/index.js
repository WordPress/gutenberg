/**
 * External dependencies
 */
import { render, fireEvent, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MediaReplaceFlow from '../';

const noop = () => {};

function setUpMediaReplaceFlow() {
	let container;
	act( () => {
		container = render(
			<MediaReplaceFlow
				mediaId={ 1 }
				mediaURL={ 'https://example.media' }
				allowedTypes={ [ 'png' ] }
				accept="image/*"
				onSelect={ noop }
				onSelectURL={ noop }
				onError={ noop }
				onCloseModal={ noop }
			/>
		).container;
	} );
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
		act( () => {
			mediaReplaceButton.click();
		} );

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
		act( () => {
			mediaReplaceButton.click();
		} );

		const mediaURL = container.querySelector( '.components-external-link' );

		expect( mediaURL.href ).toEqual( 'https://example.media/' );
	} );

	it( 'edits media URL', () => {
		const container = setUpMediaReplaceFlow();

		const mediaReplaceButton = container.querySelector(
			'button[aria-expanded="false"]'
		);
		act( () => {
			mediaReplaceButton.click();
		} );

		const editMediaURL = container.querySelector(
			'.block-editor-link-control__search-item-action'
		);

		act( () => {
			editMediaURL.click();
		} );

		const mediaURLInput = container.querySelector(
			'.block-editor-url-input__input'
		);

		act( () => {
			fireEvent.change( mediaURLInput, {
				target: { value: 'https://new.example.media' },
			} );
		} );

		const saveMediaURLButton = container.querySelector(
			'.block-editor-link-control__search-submit'
		);

		act( () => {
			saveMediaURLButton.click();
		} );

		const mediaURL = container.querySelector( '.components-external-link' );

		expect( mediaURL.href ).toEqual( 'https://new.example.media/' );
	} );
} );
