/**
 * External dependencies
 */
const path = require( 'path' ); // import fs from 'fs';

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Classic', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();

		await editor.insertBlock( { name: 'core/freeform' } );

		// Ensure there is focus.
		await page.focus( '.mce-content-body' );
		await page.keyboard.type( 'test' );
	} );

	test( 'should be inserted', async ( { editor, pageUtils } ) => {
		// Move focus away.
		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should insert media, convert to blocks, and undo in one step', async ( {
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		// Click the image button.
		// await page.click( 'role=button[name="Add Media (⌃⌥M)"i]' );

		const uploadedMedia = await requestUtils.uploadMedia(
			path.resolve(
				process.cwd(),
				'test/e2e/assets/10x10_e2e_test_image_z9T8jK.png'
			)
		);

		pageUtils.setClipboardData( {
			plainText: `[gallery ids="${ uploadedMedia.id }"]`,
		} );

		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		// // Wait for image to be inserted.
		await page.waitForSelector( '.mce-content-body img' );

		// Move focus away and verify gallery was inserted.
		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );
		expect( await editor.getEditedPostContent() ).toMatch(
			/\[gallery ids=\"\d+\"\]/
		);

		// Convert to blocks and verify it worked correctly.
		await editor.clickBlockToolbarButton( 'Convert to blocks', 'content' );
		expect( await editor.getEditedPostContent() ).toMatch(
			/<!-- wp:gallery/
		);

		// Check that you can undo back to a Classic block gallery in one step.
		await pageUtils.pressKeyWithModifier( 'primary', 'z' );
		expect( await editor.getEditedPostContent() ).toMatch(
			/\[gallery ids=\"\d+\"\]/
		);

		// Convert to blocks again and verify it worked correctly.
		await editor.clickBlockToolbarButton( 'Convert to blocks', 'content' );
		expect( await editor.getEditedPostContent() ).toMatch(
			/<!-- wp:gallery/
		);
	} );

	test( 'Should not fail after save/reload', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Might move to utils if this becomes useful enough for other tests.
		const runWithoutCache = async ( cb ) => {
			try {
				await page.route( '**/*', ( route ) => {
					const headers = route.request().allHeaders();
					headers[ 'Cache-Control' ] = 'no-cache';
					headers.Pragma = 'no-cache';
					headers.Expires = '0';
					headers[ 'Surrogate-Control' ] = 'no-store';
					route.continue( { headers } );
				} );

				await cb();
			} finally {
				await page.route( '**/*', ( route ) => {
					const headers = route.request().allHeaders();
					delete headers[ 'Cache-Control' ];
					delete headers.Pragma;
					delete headers.Expires;
					delete headers[ 'Surrogate-Control' ];
					route.continue( { headers } );
				} );
			}
		};

		// Move focus away.
		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );

		// Save.
		await page.click( 'role=button[name="Save draft"i]' );
		await page.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text=Draft saved'
		);

		// Reload
		// Disabling the browser disk cache is needed in order to reproduce the issue
		// in case it regresses. To test this, revert commit 65c9f74, build and run the test.
		await runWithoutCache( () => page.reload() );

		await page.focus( 'role=document[name="Block: Classic"i]' );

		page.on( 'console', ( msg ) => {
			expect( msg.type() ).not.toBe( 'error' );
		} );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
