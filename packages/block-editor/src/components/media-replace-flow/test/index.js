/**
 * External dependencies
 */
import { noop } from 'lodash';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import MediaReplaceFlow from '../';

let container = null;

beforeAll( () => {
	registerCoreBlocks();
} );

beforeEach( async () => {
	// setup a DOM element as a render target
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( async () => {
	// cleanup on exiting
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

function getMediaReplaceButton() {
	return container.querySelector( 'button[aria-expanded="false"]' );
}

function setUpMediaReplaceFlow() {
	act( () => {
		render(
			<MediaReplaceFlow
				mediaId={ 1 }
				mediaURL={ 'https://example.media' }
				allowedTypes={ [ 'png' ] }
				accept="image/*"
				onSelect={ noop }
				onSelectURL={ noop }
				onError={ noop }
				onCloseModal={ noop }
			/>,
			container
		);
	} );
}

describe( 'General media replace flow', () => {
	it( 'renders successfully', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = getMediaReplaceButton();

		expect( mediaReplaceButton ).not.toBeNull();
	} );

	it( 'renders replace menu', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = getMediaReplaceButton();
		mediaReplaceButton.click();

		const uploadMenu = container.querySelector(
			'.block-editor-media-replace-flow__media-upload-menu'
		);

		expect( uploadMenu ).not.toBeNull();
	} );

	it( 'displays media URL', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = getMediaReplaceButton();
		mediaReplaceButton.click();

		const mediaURL = container.querySelector( '.components-external-link' );

		expect( mediaURL.href ).toEqual( 'https://example.media/' );
	} );

	it( 'edits media URL', () => {
		setUpMediaReplaceFlow();

		const mediaReplaceButton = getMediaReplaceButton();
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
		act( () => {
			saveMediaURLButton.click();
		} );

		const mediaURL = container.querySelector( '.components-external-link' );

		expect( mediaURL.href ).toEqual( 'https://new.example.media/' );
	} );
} );
