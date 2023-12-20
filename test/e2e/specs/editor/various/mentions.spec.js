/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'autocomplete mentions', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.createUser( {
			username: 'testuser',
			email: 'testuser@example.com',
			firstName: 'Jane',
			lastName: 'Doe',
			password: 'secret',
		} );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
	} );

	test( 'should insert mention', async ( { page, editor } ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'I am @ad' );
		await expect(
			page.locator( 'role=listbox >> role=option[name=/admin/i]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '.' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>I am @admin.</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should insert mention between two other words', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Stuck in the middle with you' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 'you'.length } );
		await page.keyboard.type( '@j' );
		await expect(
			page.locator( 'role=listbox >> role=option[name=/testuser/i]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' ' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>Stuck in the middle with @testuser you</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should insert two subsequent mentions', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'I am @j' );
		await expect(
			page.locator( 'role=listbox >> role=option[name=/testuser/i]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' @ad' );
		await expect(
			page.locator( 'role=listbox >> role=option[name=/admin/i]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '.' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>I am @testuser @admin.</p>
<!-- /wp:paragraph -->`
		);
	} );
} );
