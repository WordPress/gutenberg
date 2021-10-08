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

const modalDismissEvent = Platform.OS === 'ios' ? 'onDismiss' : 'onModalHide';

beforeAll( () => {
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
		fireEvent( getByTestId( 'embed-edit-url-modal' ), modalDismissEvent );

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
		const expectedURL = 'http://www.wordpress.org';

		// Return mocked responses for the oembed endpoint.
		fetchRequest.mockImplementation( ( { path } ) => {
			let response = {};
			if ( path.startsWith( '/oembed/1.0/proxy' ) ) {
				response = { data: '<p>embed preview</p>' };
			}
			return Promise.resolve( response );
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

		// Set an URL
		const textInput = getByPlaceholderText( 'Add link' );
		fireEvent( textInput, 'focus' );
		fireEvent.changeText( textInput, expectedURL );

		// Dismiss the edit URL modal
		fireEvent( getByTestId( 'embed-edit-url-modal' ), modalDismissEvent );

		expect( getEditorHtml() ).toBe(
			`<!-- wp:embed {"url":"${ expectedURL }"} /-->`
		);
	} );
} );
