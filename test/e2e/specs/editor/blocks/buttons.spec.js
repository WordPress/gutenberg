/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

 test.describe( 'Buttons', () => {
	 test.beforeEach( async ( { admin } ) => {
		 await admin.createNewPost();
	 } );
 
	 test( 'has focus on button content', async ( { editor, page } ) => {
		 await editor.insertBlock( { name: 'core/buttons' } );
		 await page.keyboard.type( 'Content' );
 
		 //Check the content
		 const content = await editor.getEditedPostContent();
		 expect( content ).toBe(
			 `<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		 );
	 } );
 
	 test( 'has focus on button content (slash inserter)', async ( {
		 editor,
		 page,
	 } ) => {
		 await page.click( 'role=button[name="Add default block"i]' );
		 await page.keyboard.type( '/buttons' );
		 await page.keyboard.press( 'Enter' );
		 await page.keyboard.type( 'Content' );
 
		 //Check the content
		 const content = await editor.getEditedPostContent();
		 expect( content ).toBe(
			 `<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		 );
	 } );
 
	 test( 'dismisses link editor when escape is pressed', async ( {
		 editor,
		 page,
		 pageUtils,
	 } ) => {
		 // Regression: https://github.com/WordPress/gutenberg/pull/19885
		 await editor.insertBlock( { name: 'core/buttons' } );
		 await pageUtils.pressKeyWithModifier( 'primary', 'k' );
		 await page.waitForFunction(
			 () => !! document.activeElement.closest( '.block-editor-url-input' )
		 );
		 await page.keyboard.press( 'Escape' );
		 await page.waitForFunction(
			 () =>
				 document.activeElement ===
				 document.querySelector( '.block-editor-rich-text__editable' )
		 );
		 await page.keyboard.type( 'WordPress' );
		 // Check the content
		 const content = await editor.getEditedPostContent();
		 expect( content ).toBe(
			 `<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">WordPress</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		 );
	 } );
 
	 test( 'moves focus from the link editor back to the button when escape is pressed after the URL has been submitted', async ( {
		 editor,
		 page,
		 pageUtils,
	 } ) => {
		 // Regression: https://github.com/WordPress/gutenberg/issues/34307
		 await editor.insertBlock( { name: 'core/buttons' } );
		 await pageUtils.pressKeyWithModifier( 'primary', 'k' );
		 await page.waitForFunction(
			 () => !! document.activeElement.closest( '.block-editor-url-input' )
		 );
		 await page.keyboard.type( 'https://example.com' );
		 await page.keyboard.press( 'Enter' );
		 await page.waitForFunction(
			 () =>
				 document.activeElement ===
				 document.querySelector(
					 '.block-editor-link-control a[href="https://example.com"]'
				 )
		 );
		 await page.keyboard.press( 'Escape' );
 
		 // Focus should move from the link control to the button block's text.
		 await page.waitForFunction(
			 () =>
				 document.activeElement ===
				 document.querySelector( '[aria-label="Button text"]' )
		 );
 
		 // The link control should still be visible when a URL is set.
		 const linkControl = await page.$( '.block-editor-link-control' );
		 expect( linkControl ).toBeTruthy();
	 } );
 
	 test( 'can jump to the link editor using the keyboard shortcut', async ( {
		 editor,
		 page,
		 pageUtils,
	 } ) => {
		 await editor.insertBlock( { name: 'core/buttons' } );
		 await page.keyboard.type( 'WordPress' );
		 await pageUtils.pressKeyWithModifier( 'primary', 'k' );
		 await page.keyboard.type( 'https://www.wordpress.org/' );
		 await page.keyboard.press( 'Enter' );
		 // Make sure that the dialog is still opened, and that focus is retained
		 // within (focusing on the link preview).
		 await page.waitForSelector(
			 ':focus.block-editor-link-control__search-item-title'
		 );
 
		 // Check the content
		 const content = await editor.getEditedPostContent();
		 expect( content ).toBe(
			 `<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://www.wordpress.org/">WordPress</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		 );
	 } );
 } );