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
const RICH_TEXT_EMBED_HTML_WITH_CAPTION = `<!-- wp:embed {"url":"https://twitter.com/notnownikki","type":"rich","providerNameSlug":"twitter","responsive":true} -->
<figure class="wp-block-embed is-type-rich is-provider-twitter wp-block-embed-twitter"><div class="wp-block-embed__wrapper">
https://twitter.com/notnownikki
</div><figcaption>Caption</figcaption></figure>
<!-- /wp:embed -->`;

const MOST_USED_PROVIDERS = embed.settings.variations.filter( ( { name } ) =>
	[ 'youtube', 'twitter', 'wordpress', 'vimeo' ].includes( name )
);

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
	describe( 'Block insertion', () => {
		it( 'inserts generic embed block', async () => {
			const { getByA11yLabel, getByText } = await initializeEditor( {
				initialHtml: '',
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
			expect( getEditorHtml() ).toBe( '<!-- wp:embed /-->' );
		} );

		MOST_USED_PROVIDERS.forEach( ( { attributes, title } ) =>
			it( `inserts ${ title } embed block`, async () => {
				const { getByA11yLabel, getByText } = await initializeEditor( {
					initialHtml: '',
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
				expect( getEditorHtml() ).toBe(
					`<!-- wp:embed ${ JSON.stringify( attributes ) } /-->`
				);
			} )
		);
	} );

	describe( 'Set URL upon block insertion', () => {
		it( 'sets empty URL when dismissing edit URL modal', async () => {
			const {
				getByA11yLabel,
				getByText,
				getByTestId,
			} = await initializeEditor( {
				initialHtml: '',
			} );

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
			expect( getEditorHtml() ).toBe( RICH_TEXT_EMBED_HTML );
		} );
	} );

	describe( 'Set URL by tapping on the block', () => {
		it( 'sets empty URL when dismissing edit URL modal', async () => {
			const waitForElement = ( { getByA11yLabel } ) =>
				getByA11yLabel( /Embed Block\. Row 1/ );
			const { element, getByText, getByTestId } = await initializeEditor(
				{ initialHtml: '<!-- wp:embed /-->' },
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

			expect( getEditorHtml() ).toBe( '<!-- wp:embed {"url":""} /-->' );
		} );

		it( 'sets a valid URL when dismissing edit URL modal', async () => {
			const waitForElement = ( { getByA11yLabel } ) =>
				getByA11yLabel( /Embed Block\. Row 1/ );
			const {
				element,
				getByA11yLabel,
				getByText,
				getByPlaceholderText,
				getByTestId,
			} = await initializeEditor(
				{ initialHtml: '<!-- wp:embed /-->' },
				{ waitForElement }
			);
			const expectedURL = 'https://twitter.com/notnownikki';

			// Return mocked responses for the oembed endpoint.
			fetchRequest.mockImplementation( ( { path } ) => {
				let response = {};
				if ( path.startsWith( '/oembed/1.0/proxy' ) ) {
					response = RICH_TEXT_EMBED_SUCCESS_RESPONSE;
				}
				return Promise.resolve( response );
			} );

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
			expect( getEditorHtml() ).toBe( RICH_TEXT_EMBED_HTML );
		} );
	} );

	it( 'sets an Embed block caption', async () => {
		const {
			getByA11yLabel,
			getByText,
			getByPlaceholderText,
			getByTestId,
		} = await initializeEditor( {
			initialHtml: '',
		} );
		const expectedURL = 'https://twitter.com/notnownikki';
		const expectedCaption = 'Caption';

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

		// Set a caption
		const caption = getByTestId( 'embed-caption' );
		fireEvent( caption, 'focus' );
		fireEvent.changeText( caption, expectedCaption );

		expect( getEditorHtml() ).toBe( RICH_TEXT_EMBED_HTML_WITH_CAPTION );
	} );
} );
