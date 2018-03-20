/* eslint-env jest */
/* global page */

/**
 * Internal dependencies
 */
import './support/bootstrap';
import { newPost } from './support';

// Tests
describe( 'adding blocks', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'Should insert content using the placeholder and the regular inserter', async () => {
		// Default block appender is provisional
		await page.click( '.editor-default-block-appender' );
		await page.click( '.editor-post-title__input' );

		// Post is empty, the newly created paragraph has been removed on focus out
		const paragraphBlock = await page.$( '[data-type="core/paragraph"]' );
		expect( paragraphBlock ).toBeNull();

		// Using the placeholder
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'Paragraph block' );

		// Using the slash command
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/quote' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Quote block' );

		// Using the regular inserter
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.type( 'code' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Code block' );

		// Using the between inserter
		await page.mouse.move( 200, 300 );
		await page.mouse.move( 250, 350 );
		await page.click( '[data-type="core/paragraph"] .editor-block-list__insertion-point-inserter' );
		await page.keyboard.type( 'Second paragraph' );

		// Switch to Text Mode to check HTML Output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		// Assertions
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );

		expect( textEditorContent ).toEqual( [
			'<!-- wp:paragraph -->',
			'<p>Paragraph block</p>',
			'<!-- /wp:paragraph -->',
			'',
			'<!-- wp:paragraph -->',
			'<p>Second paragraph</p>',
			'<!-- /wp:paragraph -->',
			'',
			'<!-- wp:quote -->',
			'<blockquote class=\"wp-block-quote\">',
			'    <p>Quote block</p>',
			'</blockquote>',
			'<!-- /wp:quote -->',
			'',
			'<!-- wp:code -->',
			'<pre class="wp-block-code"><code>Code block</code></pre>',
			'<!-- /wp:code -->',
		].join( '\n' ) );
	} );
} );
