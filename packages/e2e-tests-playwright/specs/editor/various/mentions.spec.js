/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'autocomplete mentions', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.createUser( 'testuser', 'Jane', 'Doe' );
	} );

	test.beforeEach( async ( { pageUtils } ) => {
		await pageUtils.createNewPost();
	} );

	test.afterAll( async ( { pageUtils } ) => {
		await pageUtils.deleteUser( 'testuser' );
	} );

	test( 'should insert mention', async ( { page, pageUtils } ) => {
		await pageUtils.clickBlockAppender();
		await page.keyboard.type( 'I am @a' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '.' );
		expect( await pageUtils.getEditedPostContent() )
			.toMatchInlineSnapshot( `
			"<!-- wp:paragraph -->
			<p>I am @admin.</p>
			<!-- /wp:paragraph -->"
		` );
	} );

	test( 'should insert mention between two other words', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.clickBlockAppender();
		await page.keyboard.type( 'Stuck in the middle with you.' );
		await page.pressKeyTimes( 'ArrowLeft', 'you.'.length );
		await page.keyboard.type( '@j' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' ' );
		expect( await pageUtils.getEditedPostContent() )
			.toMatchInlineSnapshot( `
			"<!-- wp:paragraph -->
			<p>Stuck in the middle with @testuser you.</p>
			<!-- /wp:paragraph -->"
		` );
	} );

	test( 'should insert two subsequent mentions', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.clickBlockAppender();
		await page.keyboard.type( 'I am @j' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' @a' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '.' );
		expect( await pageUtils.getEditedPostContent() )
			.toMatchInlineSnapshot( `
			"<!-- wp:paragraph -->
			<p>I am @testuser @admin.</p>
			<!-- /wp:paragraph -->"
		` );
	} );
} );
