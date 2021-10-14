/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	fireEvent,
	waitFor,
	within,
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

// oEmbed response mocks
const RICH_TEXT_EMBED_SUCCESS_RESPONSE = {
	url: 'https://twitter.com/notnownikki',
	html: '<p>Mock success response.</p>',
	type: 'rich',
	provider_name: 'Twitter',
	provider_url: 'https://twitter.com',
	version: '1.0',
};
const VIDEO_EMBED_SUCCESS_RESPONSE = {
	url: 'https://www.youtube.com/watch?v=lXMskKTw3Bc',
	html: '<iframe width="16" height="9"></iframe>',
	type: 'video',
	provider_name: 'YouTube',
	provider_url: 'https://youtube.com',
	version: '1.0',
};

// Embed block HTML examples
const EMPTY_EMBED_HTML = '<!-- wp:embed /-->';
const EMPTY_URL_EMBED_HTML = '<!-- wp:embed {"url":""} /-->';
const RICH_TEXT_EMBED_HTML = `<!-- wp:embed {"url":"https://twitter.com/notnownikki","type":"rich","providerNameSlug":"twitter","responsive":true} -->
<figure class="wp-block-embed is-type-rich is-provider-twitter wp-block-embed-twitter"><div class="wp-block-embed__wrapper">
https://twitter.com/notnownikki
</div></figure>
<!-- /wp:embed -->`;
const VIDEO_EMBED_HTML = `<!-- wp:embed {"url":"https://www.youtube.com/watch?v=lXMskKTw3Bc","type":"video","providerNameSlug":"youtube","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">
https://www.youtube.com/watch?v=lXMskKTw3Bc
</div></figure>
<!-- /wp:embed -->`;

const MOST_USED_PROVIDERS = embed.settings.variations.filter( ( { name } ) =>
	[ 'youtube', 'twitter', 'wordpress', 'vimeo' ].includes( name )
);

// Return specified mocked responses for the oembed endpoint.
const mockEmbedResponses = ( mockedResponses ) => {
	fetchRequest.mockImplementation( ( { path } ) => {
		const matchedEmbedResponse = mockedResponses.find(
			( mockedResponse ) =>
				path ===
				`/oembed/1.0/proxy?url=${ encodeURIComponent(
					mockedResponse.url
				) }`
		);
		return Promise.resolve( matchedEmbedResponse || {} );
	} );
};

beforeAll( () => {
	// Paragraph block needs to be registered because by default a paragraph
	// block is added to empty posts.
	registerBlock( paragraph );
	registerBlock( embed );

	// Mock embed responses
	mockEmbedResponses( [
		RICH_TEXT_EMBED_SUCCESS_RESPONSE,
		VIDEO_EMBED_SUCCESS_RESPONSE,
	] );
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Embed block', () => {
	describe( 'Block insertion', () => {
		it( 'inserts generic embed block', async () => {
			const initialHtml = '';
			const expectedHtml = EMPTY_EMBED_HTML;

			const { getByA11yLabel, getByText } = await initializeEditor( {
				initialHtml,
			} );

			// Open the inserter menu
			fireEvent.press(
				await waitFor( () => getByA11yLabel( 'Add block' ) )
			);

			// Insert an embed block
			fireEvent.press( await waitFor( () => getByText( `Embed` ) ) );

			// Get the embed block
			const embedblock = await waitFor( () =>
				getByA11yLabel( /Embed Block\. Row 1/ )
			);
			const embedBlockName = within( embedblock ).getByText( 'Embed' );

			expect( embedBlockName ).toBeDefined();
			expect( getEditorHtml() ).toBe( expectedHtml );
		} );

		MOST_USED_PROVIDERS.forEach( ( { attributes, title } ) =>
			it( `inserts ${ title } embed block`, async () => {
				const initialHtml = '';
				const expectedHtml = `<!-- wp:embed ${ JSON.stringify(
					attributes
				) } /-->`;

				const { getByA11yLabel, getByText } = await initializeEditor( {
					initialHtml,
				} );

				// Open the inserter menu
				fireEvent.press(
					await waitFor( () => getByA11yLabel( 'Add block' ) )
				);

				// Insert a specific embed block
				fireEvent.press( await waitFor( () => getByText( title ) ) );

				// Get the embed block
				const embedblock = await waitFor( () =>
					getByA11yLabel( /Embed Block\. Row 1/ )
				);
				const embedBlockName = within( embedblock ).getByText( title );

				expect( embedBlockName ).toBeDefined();
				expect( getEditorHtml() ).toBe( expectedHtml );
			} )
		);
	} );

	describe( 'Set URL upon block insertion', () => {
		it( 'sets empty URL when dismissing edit URL modal', async () => {
			const initialHtml = '';
			const expectedHtml = EMPTY_URL_EMBED_HTML;

			const {
				getByA11yLabel,
				getByText,
				getByTestId,
			} = await initializeEditor( { initialHtml } );

			// Open the inserter menu
			fireEvent.press(
				await waitFor( () => getByA11yLabel( 'Add block' ) )
			);

			// Insert an embed block
			fireEvent.press( await waitFor( () => getByText( `Embed` ) ) );

			// Wait for edit URL modal to be visible
			const embedEditURLModal = getByTestId( 'embed-edit-url-modal' );
			await waitFor( () => embedEditURLModal.props.isVisible );

			// Dismiss the edit URL modal
			fireEvent( embedEditURLModal, 'backdropPress' );
			fireEvent( embedEditURLModal, MODAL_DISMISS_EVENT );

			expect( getEditorHtml() ).toBe( expectedHtml );
		} );

		it( 'sets a valid URL when dismissing edit URL modal', async () => {
			const initialHtml = '';
			const expectedHtml = RICH_TEXT_EMBED_HTML;
			const expectedURL = 'https://twitter.com/notnownikki';

			const {
				getByA11yLabel,
				getByText,
				getByPlaceholderText,
				getByTestId,
			} = await initializeEditor( { initialHtml } );

			// Open the inserter menu
			fireEvent.press(
				await waitFor( () => getByA11yLabel( 'Add block' ) )
			);

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
			expect( getEditorHtml() ).toBe( expectedHtml );
		} );
	} );

	describe( 'Set URL by tapping on an empty block', () => {
		it( 'sets empty URL when dismissing edit URL modal', async () => {
			const initialHtml = EMPTY_EMBED_HTML;
			const expectedHtml = EMPTY_URL_EMBED_HTML;

			const waitForElement = ( { getByA11yLabel } ) =>
				getByA11yLabel( /Embed Block\. Row 1/ );
			const { element, getByText, getByTestId } = await initializeEditor(
				{ initialHtml },
				{ waitForElement }
			);

			// Select block
			fireEvent.press( element );

			// Edit URL
			fireEvent.press( await waitFor( () => getByText( 'ADD LINK' ) ) );

			// Wait for edit URL modal to be visible
			const embedEditURLModal = getByTestId( 'embed-edit-url-modal' );
			await waitFor( () => embedEditURLModal.props.isVisible );

			// Dismiss the edit URL modal
			fireEvent( embedEditURLModal, 'backdropPress' );
			fireEvent( embedEditURLModal, MODAL_DISMISS_EVENT );

			expect( getEditorHtml() ).toBe( expectedHtml );
		} );

		it( 'sets a valid URL when dismissing edit URL modal', async () => {
			const initialHtml = EMPTY_EMBED_HTML;
			const expectedHtml = RICH_TEXT_EMBED_HTML;
			const expectedURL = 'https://twitter.com/notnownikki';

			const waitForElement = ( { getByA11yLabel } ) =>
				getByA11yLabel( /Embed Block\. Row 1/ );
			const {
				element,
				getByA11yLabel,
				getByText,
				getByPlaceholderText,
				getByTestId,
			} = await initializeEditor( { initialHtml }, { waitForElement } );

			// Select block
			fireEvent.press( element );

			// Edit URL
			fireEvent.press( getByText( 'ADD LINK' ) );

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
			expect( getEditorHtml() ).toBe( expectedHtml );
		} );
	} );

	describe( 'Edit URL', () => {
		it( 'keeps the previous URL if no URL is set', async () => {
			const initialHtml = RICH_TEXT_EMBED_HTML;

			const waitForElement = ( { getByA11yLabel } ) =>
				getByA11yLabel( /Embed Block\. Row 1/ );
			const {
				element,
				getByA11yLabel,
				getByTestId,
			} = await initializeEditor( { initialHtml }, { waitForElement } );

			// Select block
			fireEvent.press( element );

			// Edit URL
			fireEvent.press(
				await waitFor( () => getByA11yLabel( 'Edit URL' ) )
			);

			// Wait for edit URL modal to be visible
			const embedEditURLModal = getByTestId( 'embed-edit-url-modal' );
			await waitFor( () => embedEditURLModal.props.isVisible );

			// Dismiss the edit URL modal
			fireEvent( embedEditURLModal, 'backdropPress' );
			fireEvent( embedEditURLModal, MODAL_DISMISS_EVENT );

			expect( getEditorHtml() ).toBe( initialHtml );
		} );

		it( 'replaces URL', async () => {
			const initialHtml = RICH_TEXT_EMBED_HTML;
			const expectedHtml = VIDEO_EMBED_HTML;
			const initialURL = 'https://twitter.com/notnownikki';
			const expectedURL = 'https://www.youtube.com/watch?v=lXMskKTw3Bc';

			const waitForElement = ( { getByA11yLabel } ) =>
				getByA11yLabel( /Embed Block\. Row 1/ );
			const {
				element,
				getByA11yLabel,
				getByDisplayValue,
				getByTestId,
			} = await initializeEditor( { initialHtml }, { waitForElement } );

			// Select block
			fireEvent.press( element );

			// Edit URL
			fireEvent.press(
				await waitFor( () => getByA11yLabel( 'Edit URL' ) )
			);

			// Wait for edit URL modal to be visible
			const embedEditURLModal = getByTestId( 'embed-edit-url-modal' );
			await waitFor( () => embedEditURLModal.props.isVisible );

			// Start editing link
			fireEvent.press(
				getByA11yLabel( `Twitter link, ${ initialURL }` )
			);

			// Replace URL
			const linkTextInput = getByDisplayValue( initialURL );
			fireEvent( linkTextInput, 'focus' );
			fireEvent.changeText( linkTextInput, expectedURL );

			// Dismiss the edit URL modal
			fireEvent( embedEditURLModal, 'backdropPress' );
			fireEvent( embedEditURLModal, MODAL_DISMISS_EVENT );

			// Get YouTube link field
			const youtubeLinkField = await waitFor( () =>
				getByA11yLabel( `YouTube link, ${ expectedURL }` )
			);

			expect( youtubeLinkField ).toBeDefined();
			expect( getEditorHtml() ).toBe( expectedHtml );
		} );

		it( 'keeps the previous URL if an invalid URL is set', async () => {
			const initialHtml = RICH_TEXT_EMBED_HTML;
			const previousURL = 'https://twitter.com/notnownikki';
			const invalidURL = 'http://';

			const waitForElement = ( { getByA11yLabel } ) =>
				getByA11yLabel( /Embed Block\. Row 1/ );
			const {
				element,
				getByA11yLabel,
				getByDisplayValue,
				getByTestId,
				getByText,
			} = await initializeEditor( { initialHtml }, { waitForElement } );

			// Select block
			fireEvent.press( element );

			// Edit URL
			fireEvent.press(
				await waitFor( () => getByA11yLabel( 'Edit URL' ) )
			);

			// Wait for edit URL modal to be visible
			const embedEditURLModal = getByTestId( 'embed-edit-url-modal' );
			await waitFor( () => embedEditURLModal.props.isVisible );

			// Start editing link
			fireEvent.press(
				getByA11yLabel( `Twitter link, ${ previousURL }` )
			);

			// Replace URL
			const linkTextInput = getByDisplayValue( previousURL );
			fireEvent( linkTextInput, 'focus' );
			fireEvent.changeText( linkTextInput, invalidURL );

			// Dismiss the edit URL modal
			fireEvent( embedEditURLModal, 'backdropPress' );
			fireEvent( embedEditURLModal, MODAL_DISMISS_EVENT );

			const errorNotice = await waitFor( () =>
				getByText( 'Invalid URL. Please enter a valid URL.' )
			);

			expect( errorNotice ).toBeDefined();
			expect( getEditorHtml() ).toBe( initialHtml );
		} );
	} );
} );
