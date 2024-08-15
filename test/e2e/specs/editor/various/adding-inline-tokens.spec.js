/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'adding inline tokens', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should insert inline image', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a paragraph.
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		await page.keyboard.type( 'a ' );

		await editor.showBlockToolbar();
		await page.click( 'role=button[name="More"i]' );
		await page.click( 'role=menuitem[name="Inline image"i]' );

		const testImagePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'10x10_e2e_test_image_z9T8jK.png'
		);
		const filename = uuid();
		const tmpFileName = path.join( os.tmpdir(), filename + '.png' );
		fs.copyFileSync( testImagePath, tmpFileName );
		await page
			.locator( '.media-modal .moxie-shim input[type=file]' )
			.setInputFiles( tmpFileName );

		// Insert the uploaded image.
		await page.click( 'role=button[name="Select"i]' );

		// Check the content.
		const contentRegex = new RegExp(
			`a <img class="wp-image-\\d+" style="width:\\s*10px;?" src="[^"]+\\/${ filename }\\.png" alt=""\\/?>`
		);
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: expect.stringMatching( contentRegex ) },
			},
		] );

		await pageUtils.pressKeys( 'shift+ArrowLeft' );

		await page.keyboard.press( 'Tab' );
		await expect(
			page.locator( 'role=spinbutton[name="Width"i]' )
		).toBeFocused();
		await page.fill( 'role=spinbutton[name="Width"i]', '20' );
		await page.fill( 'role=textbox[name="Alternative text"i]', 'Alt' );
		await page.click( 'role=button[name="Apply"i]' );

		// Check the content.
		const contentRegex2 = new RegExp(
			`a <img class="wp-image-\\d+" style="width:\\s*20px;?" src="[^"]+\\/${ filename }\\.png" alt="Alt"\\/?>`
		);

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: expect.stringMatching( contentRegex2 ) },
			},
		] );
	} );
} );
