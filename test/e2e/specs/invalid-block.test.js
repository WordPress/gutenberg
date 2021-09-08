/**
 * Internal dependencies
 */
import {
	newPost,
	clickBlockAppender,
	setPostContent,
} from '../support/utils';

describe( 'invalid blocks', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should show an invalid block message with clickable options', async () => {
		// Create an empty paragraph with the focus in the block
		await clickBlockAppender();
		await page.keyboard.type( 'hello' );

		// Click the 'more options'
		await page.mouse.move( 200, 300, { steps: 10 } );
		await page.click( 'button[aria-label="More options"]' );

		// Change to HTML mode and close the options
		const changeModeButton = await page.waitForXPath( '//button[text()="Edit as HTML"]' );
		await changeModeButton.click();

		// Focus on the textarea and enter an invalid paragraph
		await page.click( '.editor-block-list__layout .editor-block-list__block .editor-block-list__block-html-textarea' );
		await page.keyboard.type( '<p>invalid paragraph' );

		// Takes the focus away from the block so the invalid warning is triggered
		await page.click( '.editor-post-save-draft' );
		expect( console ).toHaveErrored();
		expect( console ).toHaveWarned();

		// Click on the 'resolve' button
		await page.click( '.editor-warning__actions button' );

		// Check we get the resolve modal with the appropriate contents
		const htmlBlockContent = await page.$eval( '.editor-block-compare__html', ( node ) => node.textContent );
		expect( htmlBlockContent ).toEqual( '<p>hello</p><p>invalid paragraph' );
	} );

	it( 'should strip potentially malicious on* attributes', async () => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		// The paragraph block contains invalid HTML, which causes it to be an
		// invalid block.
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

	it( 'should strip potentially malicious script tags', async () => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		// The shortcode block contains invalid HTML, which causes it to be an
		// invalid block.
		await setPostContent(
			`
			<!-- wp:shortcode -->
			<animate onbegin=alert(1) attributeName=x dur=1s><script>alert("EVIL");</script><style>@keyframes x{}</style><a style="animation-name:x" onanimationstart="alert(2)"></a>
			<!-- /wp:shortcode -->
			`
		);

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( console ).toHaveWarned();
		expect( console ).toHaveErrored();
		expect( hasAlert ).toBe( false );
	} );
} );
