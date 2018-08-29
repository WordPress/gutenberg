/**
 * Internal dependencies
 */
import { clickBlockAppender, newPost } from '../support/utils';

describe( 'Editing modes (visual/HTML)', () => {
	beforeEach( async () => {
		await newPost();
		await clickBlockAppender();
		await page.keyboard.type( 'Hello world!' );
	} );

	it( 'should switch between visual and HTML modes', async () => {
		// This block should be in "visual" mode by default.
		let visualBlock = await page.$$( '.editor-block-list__layout .editor-block-list__block .editor-rich-text' );
		expect( visualBlock ).toHaveLength( 1 );

		// Change editing mode from "Visual" to "HTML".
		await page.waitForSelector( 'button[aria-label="More options"]' );
		await page.click( 'button[aria-label="More options"]' );
		let changeModeButton = await page.waitForXPath( '//button[text()="Edit as HTML"]' );
		await changeModeButton.click();

		// Wait for the block to be converted to HTML editing mode.
		const htmlBlock = await page.$$( '.editor-block-list__layout .editor-block-list__block .editor-block-list__block-html-textarea' );
		expect( htmlBlock ).toHaveLength( 1 );

		// Change editing mode from "HTML" back to "Visual".
		await page.waitForSelector( 'button[aria-label="More options"]' );
		await page.click( 'button[aria-label="More options"]' );
		changeModeButton = await page.waitForXPath( '//button[text()="Edit visually"]' );
		await changeModeButton.click();

		// This block should be in "visual" mode by default.
		visualBlock = await page.$$( '.editor-block-list__layout .editor-block-list__block .editor-rich-text' );
		expect( visualBlock ).toHaveLength( 1 );
	} );

	it( 'should display sidebar in HTML mode', async () => {
		// Change editing mode from "Visual" to "HTML".
		await page.waitForSelector( 'button[aria-label="More options"]' );
		await page.click( 'button[aria-label="More options"]' );
		const changeModeButton = await page.waitForXPath( '//button[text()="Edit as HTML"]' );
		await changeModeButton.click();

		// The font size picker for the paragraph block should appear, even in
		// HTML editing mode.
		const fontSizePicker = await page.$$( '.edit-post-sidebar .components-font-size-picker__buttons' );
		expect( fontSizePicker ).toHaveLength( 1 );
	} );

	it( 'should update HTML in HTML mode when sidebar is used', async () => {
		// Change editing mode from "Visual" to "HTML".
		await page.waitForSelector( 'button[aria-label="More options"]' );
		await page.click( 'button[aria-label="More options"]' );
		const changeModeButton = await page.waitForXPath( '//button[text()="Edit as HTML"]' );
		await changeModeButton.click();

		// Make sure the paragraph content is rendered as expected.
		let htmlBlockContent = await page.$eval( '.editor-block-list__layout .editor-block-list__block .editor-block-list__block-html-textarea', ( node ) => node.textContent );
		expect( htmlBlockContent ).toEqual( '<p>Hello world!</p>' );

		// Change the font size using the sidebar.
		const changeSizeButton = await page.waitForXPath( '//button[text()="L"]' );
		await changeSizeButton.click();

		// Make sure the HTML content updated.
		htmlBlockContent = await page.$eval( '.editor-block-list__layout .editor-block-list__block .editor-block-list__block-html-textarea', ( node ) => node.textContent );
		expect( htmlBlockContent ).toEqual( '<p class="has-large-font-size">Hello world!</p>' );
	} );
} );
