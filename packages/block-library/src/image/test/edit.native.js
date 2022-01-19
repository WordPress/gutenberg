/**
 * External dependencies
 */
import { act, fireEvent, initializeEditor, getEditorHtml } from 'test/helpers';
import { Image } from 'react-native';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { apiFetch } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../..';

jest.mock( '@wordpress/data-controls', () => {
	const dataControls = jest.requireActual( '@wordpress/data-controls' );
	return {
		...dataControls,
		apiFetch: jest.fn(),
	};
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
apiFetch.mockImplementation( () => apiFetchPromise );

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
		const screen = initializeEditor( { initialHtml } );
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
		const screen = initializeEditor( { initialHtml } );
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
		const screen = initializeEditor( { initialHtml } );
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
		const screen = initializeEditor( { initialHtml } );
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
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Search or type URL' ),
			'wordpress.org'
		);
		fireEvent.press( screen.getByA11yLabel( 'Apply' ) );
		fireEvent.press( screen.getByText( 'Custom URL' ) );
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
		const screen = initializeEditor( { initialHtml } );
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
		const screen = initializeEditor( { initialHtml } );
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
		const screen = initializeEditor( { initialHtml } );
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
} );
