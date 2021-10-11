/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	fireEvent,
	waitFor,
} from 'test/helpers';
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import fetchRequest from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import * as paragraph from '../../paragraph';
import * as embed from '..';
import { registerBlock } from '../..';

// Override modal mock to prevent unmounting it when is not visible.
// This is required to be able to trigger onClose and onDismiss events when
// the modal is dismissed.
jest.mock( 'react-native-modal', () => {
	const mockComponent = require( 'react-native/jest/mockComponent' );
	return mockComponent( 'react-native-modal' );
} );
const MODAL_DISMISS_EVENT = Platform.OS === 'ios' ? 'onDismiss' : 'onModalHide';

const RICH_TEXT_EMBED_SUCCESS_RESPONSE = {
	url: 'https://twitter.com/notnownikki',
	html: '<p>Mock success response.</p>',
	type: 'rich',
	provider_name: 'Twitter',
	provider_url: 'https://twitter.com',
	version: '1.0',
};
const RICH_TEXT_EMBED_HTML = `<!-- wp:embed {"url":"https://twitter.com/notnownikki","type":"rich","providerNameSlug":"twitter","responsive":true} -->
<figure class="wp-block-embed is-type-rich is-provider-twitter wp-block-embed-twitter"><div class="wp-block-embed__wrapper">
https://twitter.com/notnownikki
</div></figure>
<!-- /wp:embed -->`;

beforeAll( () => {
	// Paragraph block needs to be registered because by default a paragraph
	// block is added to empty posts.
	registerBlock( paragraph );
	registerBlock( embed );
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Embed block', () => {
	it( 'inserts an embed block', async () => {
		const { getByA11yLabel, getByText } = await initializeEditor( {
			initialHtml: '',
		} );

		// Open the inserter menu
		fireEvent.press( await waitFor( () => getByA11yLabel( 'Add block' ) ) );

		// Insert an embed block
		fireEvent.press( await waitFor( () => getByText( `Embed` ) ) );

		// Get the embed block
		const embedblock = await waitFor( () =>
			getByA11yLabel( /Embed Block\. Row 1/ )
		);

		expect( embedblock ).toBeDefined();
		expect( getEditorHtml() ).toBe( '<!-- wp:embed /-->' );
	} );

	it( 'sets empty URL when dismissing edit URL modal', async () => {
		const {
			getByA11yLabel,
			getByText,
			getByTestId,
		} = await initializeEditor( {
			initialHtml: '',
		} );

		// Open the inserter menu
		fireEvent.press( await waitFor( () => getByA11yLabel( 'Add block' ) ) );

		// Insert an embed block
		fireEvent.press( await waitFor( () => getByText( `Embed` ) ) );

		// Wait for edit URL modal to be visible
		await waitFor( () => {
			const modal = getByTestId( 'embed-edit-url-modal' );
			return modal.props.isVisible;
		} );

		// Dismiss the edit URL modal
		fireEvent( getByTestId( 'embed-edit-url-modal' ), MODAL_DISMISS_EVENT );

		expect( getEditorHtml() ).toBe( '<!-- wp:embed {"url":""} /-->' );
	} );

	it( 'sets a valid URL when dismissing edit URL modal', async () => {
		const {
			getByA11yLabel,
			getByText,
			getByPlaceholderText,
			getByTestId,
		} = await initializeEditor( {
			initialHtml: '',
		} );
		const expectedURL = 'https://twitter.com/notnownikki';

		// Return mocked responses for the oembed endpoint.
		fetchRequest.mockImplementation( ( { path } ) => {
			let response = {};
			if ( path.startsWith( '/oembed/1.0/proxy' ) ) {
				response = RICH_TEXT_EMBED_SUCCESS_RESPONSE;
			}
			return Promise.resolve( response );
		} );

		// Open the inserter menu
		fireEvent.press( await waitFor( () => getByA11yLabel( 'Add block' ) ) );

		// Insert an embed block
		fireEvent.press( await waitFor( () => getByText( `Embed` ) ) );

		// Wait for edit URL modal to be visible
		const embedEditURLModal = getByTestId( 'embed-edit-url-modal' );
		await waitFor( () => embedEditURLModal.props.isVisible );

		// Set an URL
		const linkTextInput = getByPlaceholderText( 'Add link' );
		fireEvent( linkTextInput, 'focus' );
		fireEvent.changeText( linkTextInput, expectedURL );

		// Dismiss the edit URL modal
		fireEvent( embedEditURLModal, 'backdropPress' );
		fireEvent( embedEditURLModal, MODAL_DISMISS_EVENT );

		// Wait for edit URL button to be present
		const editURLButton = await waitFor( () =>
			getByA11yLabel( 'Edit URL' )
		);

		expect( editURLButton ).toBeDefined();
		expect( getEditorHtml() ).toBe( RICH_TEXT_EMBED_HTML );
	} );
} );
