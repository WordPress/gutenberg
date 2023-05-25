/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const MatchObject = `<!-- wp:paragraph -->
<p>1st</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>2nd</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>3rd</p>
<!-- /wp:paragraph -->`;

test.describe( 'block editor keyboard shortcuts', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should move the single block up', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.getByRole( 'button', { name: 'Add default block' } ).click();
		await page.keyboard.type( '1st' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2nd' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3rd' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
		await pageUtils.pressKeys( 'secondary', 't' );
		await pageUtils.pressKeys( 'secondary', 'y' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
	} );

	test( 'should move the single block down', async ( { editor, page } ) => {
		await page.getByRole( 'button', { name: 'Add default block' } ).click();
		await page.keyboard.type( '1st' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2nd' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3rd' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
		await page.keyboard.press( 'ArrowUp' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
	} );

	test( 'should move the multiple block up', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.getByRole( 'button', { name: 'Add default block' } ).click();
		await page.keyboard.type( '1st' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2nd' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3rd' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
		await page.keyboard.press( 'ArrowUp' );
		page.locator( '[aria-label="Multiple selected blocks"]' );
		await pageUtils.pressKeys( 'secondary', 't' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
	} );

	test( 'should move the multiple block down', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.getByRole( 'button', { name: 'Add default block' } ).click();
		await page.keyboard.type( '1st' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2nd' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3rd' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
		await page.keyboard.press( 'ArrowUp' );
		page.locator( '[aria-label="Multiple selected blocks"]' );
		await pageUtils.pressKeys( 'secondary', 't' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
	} );
} );

test.describe( 'test shortcuts handling through portals in the same tree', () => {
	test.beforeEach( async ( { page, admin, pageUtils } ) => {
		await admin.createNewPost();
		await page.getByRole( 'button', { name: 'Add default block' } ).click();
		await page.keyboard.type( '1st' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2nd' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3rd' );
		await pageUtils.pressKeys( 'primary', 'a' );
		await pageUtils.pressKeys( 'primary', 'a' );
	} );

	test( 'should propagate properly and duplicate selected blocks', async ( {
		editor,
		pageUtils,
	} ) => {
		await editor.clickBlockToolbarButton( 'Options' );
		await pageUtils.pressKeys( 'primaryShift', 'd' );
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
	} );

	test( 'should prevent deleting multiple selected blocks from inputs', async ( {
		editor,
		page,
	} ) => {
		await editor.clickBlockToolbarButton( 'Options' );
		await page
			.getByRole( 'menuitem', { name: 'Create Reusable block' } )
			.click();
		await page.getByLabel( 'Name' ).click();
		await page.keyboard.type( 'hi' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Delete' );
		await page.getByRole( 'button', { name: 'Close' } ).click();
		await expect.poll( editor.getEditedPostContent ).toBe( MatchObject );
	} );
} );
