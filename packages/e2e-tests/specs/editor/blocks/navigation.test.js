
/**
 * WordPress dependencies
 */
import {
	createJSONResponse,
	createNewPost,
	getEditedPostContent,
	insertBlock,
	pressKeyWithModifier,
	setUpResponseMocking,
} from '@wordpress/e2e-test-utils';

async function mockPagesResponse( pages ) {
	const mappedPages = pages.map( ( { title, slug }, index ) => ( {
		id: index + 1,
		type: 'page',
		link: `https://this/is/a/test/url/${ slug }`,
		title: {
			rendered: title,
			raw: title,
		},
	} ) );

	await setUpResponseMocking( [
		{
			match: ( request ) => request.url().includes( `rest_route=${ encodeURIComponent( '/wp/v2/pages' ) }` ),
			onRequestMatch: createJSONResponse( mappedPages ),
		},
	] );
}

async function mockSearchResponse( items ) {
	const mappedItems = items.map( ( { title, slug }, index ) => ( {
		id: index + 1,
		subtype: 'page',
		title,
		type: 'post',
		url: `https://this/is/a/test/url/${ slug }`,
	} ) );

	await setUpResponseMocking( [
		{
			match: ( request ) => request.url().includes( `rest_route=${ encodeURIComponent( '/wp/v2/search' ) }` ),
			onRequestMatch: createJSONResponse( mappedItems ),
		},
	] );
}

async function updateActiveNavigationLink( { url, label } ) {
	if ( url ) {
		await page.type( 'input[placeholder="Search or type url"]', url );
		// Wait for the autocomplete suggestion item to appear.
		await page.waitForXPath( `//span[@class="block-editor-link-control__search-item-title"]/mark[text()="${ url }"]` );
		await page.keyboard.press( 'Enter' );
	}

	if ( label ) {
		await page.click( '.wp-block-navigation-link__content.is-selected' );

		// Ideally this would be `await pressKeyWithModifier( 'primary', 'a' )`
		// to select all text like other tests do.
		// Unfortunately, these tests don't seem to pass on Travis CI when
		// using that approach, while using `Home` and `End` they do pass.
		await page.keyboard.press( 'Home' );
		await pressKeyWithModifier( 'shift', 'End' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( label );
	}
}

describe( 'Navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'allows a navigation menu to be created using existing pages', async () => {
		// Mock the response from the Pages endpoint. This is done so that the pages returned are always
		// consistent and to test the feature more rigorously than the single default sample page.
		await mockPagesResponse( [
			{
				title: 'Home',
				slug: 'home',
			},
			{
				title: 'About',
				slug: 'about',
			},
			{
				title: 'Contact Us',
				slug: 'contact',
			},
		] );

		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block. The 'create' button is disabled until pages are loaded,
		// so we must wait for it to become not-disabled.
		await page.waitForXPath( '//button[text()="Create from all top-level pages"][not(@disabled)]' );
		const [ createFromExistingButton ] = await page.$x( '//button[text()="Create from all top-level pages"][not(@disabled)]' );
		await createFromExistingButton.click();

		// Snapshot should contain the mocked pages.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows a navigation menu to be created from an empty menu using a mixture of internal and external links', async () => {
		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block.
		await page.waitForSelector( '.wp-block-navigation-placeholder' );
		const [ createEmptyButton ] = await page.$x( '//button[text()="Create empty"]' );
		await createEmptyButton.click();

		// Add a link to the default Navigation Link block.
		await updateActiveNavigationLink( { url: 'https://wordpress.org', label: 'WP' } );

		// Move the mouse to reveal the block movers. Without this the test seems to fail.
		await page.mouse.move( 100, 100 );

		// Add another Navigation Link block.
		// Using 'click' here checks for regressions of https://github.com/WordPress/gutenberg/issues/18329,
		// an issue where the block appender requires two clicks.
		await page.click( '.wp-block-navigation .block-list-appender' );

		// For the second nav link block use an existing internal page.
		// Mock the api response so that it's consistent.
		await mockSearchResponse( [ { title: 'Contact Us', slug: 'contact-us' } ] );

		// Add a link to the default Navigation Link block.
		await updateActiveNavigationLink( { url: 'Contact Us', label: 'Get in touch' } );

		// Expect a Navigation Block with two Navigation Links in the snapshot.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// TODO - this is needed currently because when adding a link using the suggestion list,
		// a submit button is used. The form that the submit button is in is unmounted when submission
		// occurs, resulting in a warning 'Form submission canceled because the form is not connected'
		// in Chrome.
		// Ideally, the suggestions wouldn't be implemented using submit buttons.
		expect( console ).toHaveWarned();
	} );
} );
