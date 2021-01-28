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
import {
	insertBlock,
	createNewPost,
	openDocumentSettingsSidebar,
} from '@wordpress/e2e-test-utils';

async function upload( selector ) {
	await page.waitForSelector( selector );
	const inputElement = await page.$( selector );
	const testImagePath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'assets',
		'1024x768_e2e_test_image_size.jpg'
	);
	const filename = uuid();
	const tmpFileName = path.join( os.tmpdir(), filename + '.jpg' );
	fs.copyFileSync( testImagePath, tmpFileName );
	await inputElement.uploadFile( tmpFileName );
	return filename;
}

async function waitForImage( filename ) {
	await page.waitForSelector(
		`.wp-block-image img[src$="${ filename }.jpg"]`
	);
}

describe( 'Cover', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be resized using drag & drop', async () => {
		await insertBlock( 'Cover' );
		// Close the inserter
		await page.click( '.edit-post-header-toolbar__inserter-toggle' );
		// Open the sidebar
		await openDocumentSettingsSidebar();
		// Choose the first solid color as the background of the cover.
		await page.click(
			'.components-circular-option-picker__option-wrapper:first-child button'
		);

		// Select the cover block.By default the child paragraph gets selected.
		await page.click( 'button[aria-label="Outline"]' );
		await page.click(
			'.block-editor-block-navigation-block__contents-container button'
		);

		const heightInput = (
			await page.$x(
				'//div[./label[contains(text(),"Minimum height of cover")]]//input'
			)
		 )[ 0 ];

		// Verify the height of the cover is not defined
		expect(
			await page.evaluate( ( { value } ) => value, heightInput )
		).toBeFalsy();

		const resizeButton = await page.$(
			'.components-resizable-box__handle-bottom'
		);
		const boundingBoxResizeButton = await resizeButton.boundingBox();
		const coordinatesResizeButton = {
			x: boundingBoxResizeButton.x + boundingBoxResizeButton.width / 2,
			y: boundingBoxResizeButton.y + boundingBoxResizeButton.height / 2,
		};

		// Move the  mouse to the position of the resize button.
		await page.mouse.move(
			coordinatesResizeButton.x,
			coordinatesResizeButton.y
		);

		// Trigger a mousedown event against the resize button.
		// Using page.mouse.down does not works because it triggers a global event,
		// not an event for that element.
		page.evaluate( ( { x, y } ) => {
			const element = document.querySelector(
				'.components-resizable-box__handle-bottom'
			);
			event = document.createEvent( 'CustomEvent' );
			event.initCustomEvent( 'mousedown', true, true, null );
			event.clientX = x;
			event.clientY = y;
			element.dispatchEvent( event );
		}, coordinatesResizeButton );

		// Move the mouse to resize the cover.
		await page.mouse.move(
			coordinatesResizeButton.x,
			coordinatesResizeButton.y + 100,
			{ steps: 10 }
		);

		// Release the mouse.
		await page.mouse.up();

		// Verify the height of the cover has changed.
		expect(
			await page.evaluate(
				( { value } ) => Number.parseInt( value ),
				heightInput
			)
		).toBeGreaterThan( 100 );
	} );

	it( 'renders correctly', async () => {
		await insertBlock( 'Cover' );
		const filename = await upload( '.wp-block-cover input[type="file"]' );
		await waitForImage( filename );

		const coverBlockElement = await page.$( '[aria-label="Block: Cover"]' );
		const screenshot = await coverBlockElement.screenshot( {
			path: 'cover-block.png',
		} );
		expect( screenshot ).toMatchImageSnapshot();
	} );
} );
