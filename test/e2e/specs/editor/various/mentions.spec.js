/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'autocomplete mentions', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.createUser( 'testuser', 'Jane', 'Doe' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteUser( 'testuser' );
	} );

	test( 'should insert mention', async ( { page, editor } ) => {
		await editor.clickBlockAppender();
		await page.keyboard.type( 'I am @a' );
		await page.locator( 'button', { hasText: 'adminadmin' } ).click();
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>I am @admin</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should insert mention between two other words', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.clickBlockAppender();
		await page.keyboard.type( 'Stuck in the middle with you' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 'you'.length );
		await page.keyboard.type( '@j' );
		await page.locator( 'button', { hasText: 'Jane Doetestuser' } ).click();
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>Stuck in the middle with @testuseryou</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should insert two subsequent mentions', async ( {
		page,
		editor,
	} ) => {
		await editor.clickBlockAppender();
		await page.keyboard.type( 'I am @j' );
		await page.locator( 'button', { hasText: 'Jane Doetestuser' } ).click();
		await page.keyboard.type( ' ' );
		await page.keyboard.type( '@a' );
		await page.locator( 'button', { hasText: 'adminadmin' } ).click();
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>I am @testuser @admin</p>
<!-- /wp:paragraph -->`
		);
	} );
} );
