/**
 * External dependencies
 */
import {
	act,
	fireEvent,
	initializeEditor,
	getEditorHtml,
	render,
} from 'test/helpers';
import { Image } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import {
	setFeaturedImage,
	sendMediaUpload,
	subscribeMediaUpload,
} from '@wordpress/react-native-bridge';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import '@wordpress/jest-console';

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../..';
import ImageEdit from '../edit';

let uploadCallBack;
subscribeMediaUpload.mockImplementation( ( callback ) => {
	uploadCallBack = callback;
} );
sendMediaUpload.mockImplementation( ( payload ) => {
	uploadCallBack( payload );
} );

/**
 * Immediately invoke delayed functions. A better alternative would be using
 * fake timers and test the delay itself. However, fake timers does not work
 * with our custom waitFor implementation.
 */
jest.mock( 'lodash', () => {
	const actual = jest.requireActual( 'lodash' );
	return { ...actual, delay: ( cb ) => cb() };
} );

const apiFetchPromise = Promise.resolve( {} );

const clipboardPromise = Promise.resolve( '' );
Clipboard.getString.mockImplementation( () => clipboardPromise );

beforeAll( () => {
	registerCoreBlocks();

	// Mock Image.getSize to avoid failed attempt to size non-existant image
	const getSizeSpy = jest.spyOn( Image, 'getSize' );
	getSizeSpy.mockImplementation( ( _url, callback ) => callback( 300, 200 ) );
} );

afterAll( () => {
	getBlockTypes().forEach( ( { name } ) => {
		unregisterBlockType( name );
	} );

	// Restore mocks
	Image.getSize.mockRestore();
} );

describe( 'Image Block', () => {
	it( 'sets link to None', async () => {
		const initialHtml = `
		<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"media","className":"is-style-default"} -->
		<figure class="wp-block-image size-large is-style-default">
			<a href="https://cldup.com/cXyG__fTLN.jpg">
				<img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/>
			</a>
		<figcaption>Mountain</figcaption></figure>
		<!-- /wp:image -->`;
		const screen = await initializeEditor( { initialHtml } );
		// We must await the image fetch via `getMedia`
		await act( () => apiFetchPromise );

		fireEvent.press( screen.getByA11yLabel( /Image Block/ ) );
		// Awaiting navigation event seemingly required due to React Navigation bug
		// https://git.io/Ju35Z
		await act( () =>
			fireEvent.press( screen.getByA11yLabel( 'Open Settings' ) )
		);
		fireEvent.press( screen.getByText( 'Media File' ) );
		fireEvent.press( screen.getByText( 'None' ) );

		const expectedHtml = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"none","className":"is-style-default"} -->
<figure class="wp-block-image size-large is-style-default"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/><figcaption>Mountain</figcaption></figure>
<!-- /wp:image -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );

	it( 'sets link to Media File', async () => {
		const initialHtml = `
		<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"none","className":"is-style-default"} -->
		<figure class="wp-block-image size-large is-style-default">
			<img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/>
		<figcaption>Mountain</figcaption></figure>
		<!-- /wp:image -->`;
		const screen = await initializeEditor( { initialHtml } );
		// We must await the image fetch via `getMedia`
		await act( () => apiFetchPromise );

		fireEvent.press( screen.getByA11yLabel( /Image Block/ ) );
		// Awaiting navigation event seemingly required due to React Navigation bug
		// https://git.io/Ju35Z
		await act( () =>
			fireEvent.press( screen.getByA11yLabel( 'Open Settings' ) )
		);
		fireEvent.press( screen.getByText( 'None' ) );
		fireEvent.press( screen.getByText( 'Media File' ) );

		const expectedHtml = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"media","className":"is-style-default"} -->
<figure class="wp-block-image size-large is-style-default"><a href="https://cldup.com/cXyG__fTLN.jpg"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></a><figcaption>Mountain</figcaption></figure>
<!-- /wp:image -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );

	it( 'sets link to Custom URL', async () => {
		const initialHtml = `
		<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"none","className":"is-style-default"} -->
		<figure class="wp-block-image size-large is-style-default">
			<img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/>
		<figcaption>Mountain</figcaption></figure>
		<!-- /wp:image -->`;
		const screen = await initializeEditor( { initialHtml } );
		// We must await the image fetch via `getMedia`
		await act( () => apiFetchPromise );

		fireEvent.press( screen.getByA11yLabel( /Image Block/ ) );
		// Awaiting navigation event seemingly required due to React Navigation bug
		// https://git.io/Ju35Z
		await act( () =>
			fireEvent.press( screen.getByA11yLabel( 'Open Settings' ) )
		);
		fireEvent.press( screen.getByText( 'None' ) );
		fireEvent.press( screen.getByText( 'Custom URL' ) );
		// Await asynchronous fetch of clipboard
		await act( () => clipboardPromise );
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Search or type URL' ),
			'wordpress.org'
		);
		fireEvent.press( screen.getByA11yLabel( 'Apply' ) );

		const expectedHtml = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"custom","className":"is-style-default"} -->
<figure class="wp-block-image size-large is-style-default"><a href="http://wordpress.org"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></a><figcaption>Mountain</figcaption></figure>
<!-- /wp:image -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );

	it( 'swaps the link between destinations', async () => {
		const initialHtml = `
		<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"none","className":"is-style-default"} -->
		<figure class="wp-block-image size-large is-style-default">
			<img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/>
		<figcaption>Mountain</figcaption></figure>
		<!-- /wp:image -->`;
		const screen = await initializeEditor( { initialHtml } );
		// We must await the image fetch via `getMedia`
		await act( () => apiFetchPromise );

		fireEvent.press( screen.getByA11yLabel( /Image Block/ ) );
		// Awaiting navigation event seemingly required due to React Navigation bug
		// https://git.io/Ju35Z
		await act( () =>
			fireEvent.press( screen.getByA11yLabel( 'Open Settings' ) )
		);
		fireEvent.press( screen.getByText( 'None' ) );
		fireEvent.press( screen.getByText( 'Media File' ) );
		fireEvent.press( screen.getByText( 'Custom URL' ) );
		// Await asynchronous fetch of clipboard
		await act( () => clipboardPromise );
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Search or type URL' ),
			'wordpress.org'
		);
		fireEvent.press( screen.getByA11yLabel( 'Apply' ) );
		fireEvent.press( screen.getByText( 'Custom URL' ) );
		// Await asynchronous fetch of clipboard
		await act( () => clipboardPromise );
		fireEvent.press( screen.getByText( 'Media File' ) );

		const expectedHtml = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"media","className":"is-style-default"} -->
<figure class="wp-block-image size-large is-style-default"><a href="https://cldup.com/cXyG__fTLN.jpg"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></a><figcaption>Mountain</figcaption></figure>
<!-- /wp:image -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );

	it( 'does not display the Link To URL within the Custom URL input when set to Media File and query parameters are present', async () => {
		const initialHtml = `
		<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"media","className":"is-style-default"} -->
		<figure class="wp-block-image size-large is-style-default">
			<a href="https://cldup.com/cXyG__fTLN.jpg">
				<img src="https://cldup.com/cXyG__fTLN.jpg?w=683" alt="" class="wp-image-1"/>
			</a>
		<figcaption>Mountain</figcaption></figure>
		<!-- /wp:image -->`;
		const screen = await initializeEditor( { initialHtml } );
		// We must await the image fetch via `getMedia`
		await act( () => apiFetchPromise );

		fireEvent.press( screen.getByA11yLabel( /Image Block/ ) );
		// Awaiting navigation event seemingly required due to React Navigation bug
		// https://git.io/Ju35Z
		await act( () =>
			fireEvent.press( screen.getByA11yLabel( 'Open Settings' ) )
		);
		fireEvent.press( screen.getByText( 'Media File' ) );

		expect( screen.queryByA11yLabel( /https:\/\/cldup\.com/ ) ).toBeNull();
	} );

	it( 'sets link target', async () => {
		const initialHtml = `
		<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"custom","className":"is-style-default"} -->
		<figure class="wp-block-image size-large is-style-default">
			<a href="https://wordpress.org">
				<img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/>
			</a>
		<figcaption>Mountain</figcaption></figure>
		<!-- /wp:image -->`;
		const screen = await initializeEditor( { initialHtml } );
		// We must await the image fetch via `getMedia`
		await act( () => apiFetchPromise );

		const imageBlock = screen.getByA11yLabel( /Image Block/ );
		fireEvent.press( imageBlock );

		const settingsButton = screen.getByA11yLabel( 'Open Settings' );
		// Awaiting navigation event seemingly required due to React Navigation bug
		// https://git.io/Ju35Z
		await act( () => fireEvent.press( settingsButton ) );

		const linkTargetButton = screen.getByText( 'Open in new tab' );
		fireEvent.press( linkTargetButton );

		const expectedHtml = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"custom","className":"is-style-default"} -->
<figure class="wp-block-image size-large is-style-default"><a href="https://wordpress.org" target="_blank" rel="noreferrer noopener"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></a><figcaption>Mountain</figcaption></figure>
<!-- /wp:image -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );

	it( 'unset link target', async () => {
		const initialHtml = `
		<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"custom","className":"is-style-default"} -->
		<figure class="wp-block-image size-large is-style-default">
			<a href="https://wordpress.org" target="_blank" rel="noreferrer noopener">
				<img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/>
			</a>
			<figcaption>Mountain</figcaption>
		</figure>
		<!-- /wp:image -->`;
		const screen = await initializeEditor( { initialHtml } );
		// We must await the image fetch via `getMedia`
		await act( () => apiFetchPromise );

		const imageBlock = screen.getByA11yLabel( /Image Block/ );
		fireEvent.press( imageBlock );

		const settingsButton = screen.getByA11yLabel( 'Open Settings' );
		// Awaiting navigation event seemingly required due to React Navigation bug
		// https://git.io/Ju35Z
		await act( () => fireEvent.press( settingsButton ) );

		const linkTargetButton = screen.getByText( 'Open in new tab' );
		fireEvent.press( linkTargetButton );

		const expectedHtml = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"custom","className":"is-style-default"} -->
<figure class="wp-block-image size-large is-style-default"><a href="https://wordpress.org"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></a><figcaption>Mountain</figcaption></figure>
<!-- /wp:image -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );

	describe( "when replacing media for an image set as the post's featured image", () => {
		function mockFeaturedMedia( featuredImageId ) {
			jest.spyOn(
				select( editorStore ),
				'getEditedPostAttribute'
			).mockImplementation( ( attributeName ) =>
				attributeName === 'featured_media' ? featuredImageId : undefined
			);
		}

		function mockGetMedia( media ) {
			jest.spyOn( select( coreStore ), 'getMedia' ).mockReturnValueOnce(
				media
			);
		}

		it( 'does not prompt to replace featured image during a new image upload', () => {
			// Arrange
			const INITIAL_IMAGE = { id: 1, url: 'mock-url-1' };
			const NEW_IMAGE_PENDING = { id: 2, url: 'mock-url-2' };
			mockFeaturedMedia( INITIAL_IMAGE.id );
			const screen = render( <ImageEdit attributes={ INITIAL_IMAGE } /> );

			// Act
			screen.update( <ImageEdit attributes={ NEW_IMAGE_PENDING } /> );
			const MEDIA_UPLOAD_STATE_UPLOADING = 1;
			sendMediaUpload( {
				state: MEDIA_UPLOAD_STATE_UPLOADING,
				mediaId: NEW_IMAGE_PENDING.id,
				progress: 0.1,
			} );

			// Assert
			expect( setFeaturedImage ).not.toHaveBeenCalled();
		} );

		it( 'does not prompt to replace featured image after a new image upload fails', () => {
			// Arrange
			const INITIAL_IMAGE = { id: 1, url: 'mock-url-1' };
			const NEW_IMAGE_PENDING = { id: 2, url: 'mock-url-2' };
			mockFeaturedMedia( INITIAL_IMAGE.id );
			const screen = render(
				<ImageEdit
					attributes={ INITIAL_IMAGE }
					setAttributes={ () => {} }
				/>
			);

			// Act
			screen.update(
				<ImageEdit
					attributes={ NEW_IMAGE_PENDING }
					setAttributes={ () => {} }
				/>
			);
			const MEDIA_UPLOAD_STATE_UPLOADING = 1;
			sendMediaUpload( {
				state: MEDIA_UPLOAD_STATE_UPLOADING,
				mediaId: NEW_IMAGE_PENDING.id,
				progress: 0.1,
			} );
			const MEDIA_UPLOAD_STATE_FAILED = 3;
			sendMediaUpload( {
				state: MEDIA_UPLOAD_STATE_FAILED,
				mediaId: NEW_IMAGE_PENDING.id,
			} );

			// Assert
			expect( setFeaturedImage ).not.toHaveBeenCalled();
		} );

		it( 'prompts to replace featured image after a new image upload succeeds', () => {
			// Arrange
			const INITIAL_IMAGE = { id: 1, url: 'mock-url-1' };
			const NEW_IMAGE_PENDING = { id: 2, url: 'mock-url-2' };
			const NEW_IMAGE_RESOLVED = { id: 3, url: 'mock-url-2' };
			mockFeaturedMedia( INITIAL_IMAGE.id );
			const screen = render( <ImageEdit attributes={ INITIAL_IMAGE } /> );

			// Act
			screen.update( <ImageEdit attributes={ NEW_IMAGE_PENDING } /> );
			mockGetMedia( { id: NEW_IMAGE_RESOLVED.id } );
			screen.update(
				<ImageEdit
					attributes={ NEW_IMAGE_RESOLVED }
					setAttributes={ () => {} }
				/>
			);

			// Assert
			expect( setFeaturedImage ).toHaveBeenCalledTimes( 1 );
			expect( setFeaturedImage ).toHaveBeenCalledWith(
				NEW_IMAGE_RESOLVED.id
			);
		} );

		it( 'prompts to replace featured image for a cached image', () => {
			// Arrange
			const INITIAL_IMAGE = { id: 1, url: 'mock-url-1' };
			const NEW_IMAGE_RESOLVED = { id: 3, url: 'mock-url-2' };
			mockFeaturedMedia( INITIAL_IMAGE.id );
			const screen = render(
				<ImageEdit
					attributes={ INITIAL_IMAGE }
					setAttributes={ () => {} }
				/>
			);

			// Act
			mockGetMedia( { id: NEW_IMAGE_RESOLVED.id } );
			screen.update(
				<ImageEdit
					attributes={ NEW_IMAGE_RESOLVED }
					setAttributes={ () => {} }
				/>
			);

			// Assert
			expect( setFeaturedImage ).toHaveBeenCalledTimes( 1 );
			expect( setFeaturedImage ).toHaveBeenCalledWith(
				NEW_IMAGE_RESOLVED.id
			);
		} );
	} );
} );
