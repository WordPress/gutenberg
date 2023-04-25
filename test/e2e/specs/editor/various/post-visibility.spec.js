/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post visibility', () => {
	[ 'large', 'small' ].forEach( ( viewport ) => {
		test( `can be changed when the viewport is ${ viewport }`, async ( {
			page,
			admin,
			pageUtils,
			editor,
		} ) => {
			await pageUtils.setBrowserViewport( viewport );

			await admin.createNewPost();

			await editor.openDocumentSettingsSidebar();

			await page.click(
				'role=button[name="Select visibility: Public"i]'
			);

			await page.click( 'role=radio[name="Private"i]' );

			await page.click( 'role=button[name="OK"i]' );

			const currentStatus = await page.evaluate( () => {
				return window.wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			expect( currentStatus ).toBe( 'private' );
		} );

		test( `can be canceled when the viewport is ${ viewport }`, async ( {
			page,
			pageUtils,
			admin,
			editor,
		} ) => {
			await pageUtils.setBrowserViewport( viewport );

			await admin.createNewPost();

			await editor.openDocumentSettingsSidebar();

			const initialStatus = await page.evaluate( () => {
				return window.wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			await page.click(
				'role=button[name="Select visibility: Public"i]'
			);

			await page.click( 'role=radio[name="Private"i]' );

			await page.click( 'role=button[name="Cancel"i]' );

			const currentStatus = await page.evaluate( () => {
				return window.wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			expect( initialStatus ).toBe( currentStatus );
		} );
	} );

	test( 'visibility remains private even if the publish date is in the future', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();

		// Enter a title for this post.
		await page.type( 'role=textbox[name="Add title"i]', 'Title' );

		await editor.openDocumentSettingsSidebar();

		// Set a publish date for the next month.
		await page.click( 'role=button[name="Change date: Immediately"i]' );

		await page.click( 'role=button[name="View next month"i]' );
		await page.click( 'role=application[name="Calendar"] >> text=15' );

		await page.click( 'role=button[name="Select visibility: Public"i]' );

		await page.click( 'role=radio[name="Private"i]' );

		await page.click( 'role=button[name="OK"i]' );

		const currentStatus = await page.evaluate( () => {
			return window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'status' );
		} );

		expect( currentStatus ).toBe( 'private' );
	} );
} );
