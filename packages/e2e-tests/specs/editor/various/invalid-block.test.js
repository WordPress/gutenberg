/**
 * WordPress dependencies
 */
import {
	clickMenuItem,
	createNewPost,
	clickBlockAppender,
	clickBlockToolbarButton,
	setPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'invalid blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should show an invalid block message with clickable options', async () => {
		// Create an empty paragraph with the focus in the block
		await clickBlockAppender();
		await page.keyboard.type( 'hello' );

		await clickBlockToolbarButton( 'Options' );

		// Change to HTML mode and close the options
		await clickMenuItem( 'Edit as HTML' );

		// Focus on the textarea and enter an invalid paragraph
		await page.click(
			'.block-editor-block-list__layout .block-editor-block-list__block .block-editor-block-list__block-html-textarea'
		);
		await page.keyboard.type( '<p>invalid paragraph' );

		// Takes the focus away from the block so the invalid warning is triggered
		await page.click( '.editor-post-save-draft' );
		expect( console ).toHaveErrored();
		expect( console ).toHaveWarned();

		// Click on the 'three-dots' menu toggle
		await page.click(
			'.block-editor-warning__actions button[aria-label="More options"]'
		);

		await clickMenuItem( 'Resolve' );

		// Check we get the resolve modal with the appropriate contents
		const htmlBlockContent = await page.$eval(
			'.block-editor-block-compare__html',
			( node ) => node.textContent
		);
		expect( htmlBlockContent ).toEqual(
			'<p>hello</p><p>invalid paragraph'
		);
	} );

	it( 'should not alert', async () => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await setPostContent(
			`
			<!-- wp:paragraph -->
			<p>aaaa <img src onerror=alert(1)></x dde></x>1
			<!-- /wp:paragraph -->
			`
		);

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( console ).toHaveWarned();
		expect( console ).toHaveErrored();
		expect( hasAlert ).toBe( false );
	} );
} );
