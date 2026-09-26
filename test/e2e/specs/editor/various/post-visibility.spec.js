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

			await page
				.getByRole( 'button', { name: 'Change status:' } )
				.click();
			await page.getByRole( 'radio', { name: 'Private' } ).click();

			const currentStatus = await page.evaluate( () => {
				return window.wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			expect( currentStatus ).toBe( 'private' );
		} );
	} );

	test( 'visibility remains private even if the publish date is in the future', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();

		// Enter a title for this post.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'Title' );

		await editor.openDocumentSettingsSidebar();

		// Set a publish date for the next month.
		await page
			.getByRole( 'button', { name: 'Change date: Immediately' } )
			.click();

		await page.getByRole( 'button', { name: 'View next month' } ).click();
		await page
			.getByRole( 'application', { name: 'Calendar', exact: true } )
			.getByText( '15' )
			.click();
		await page
			.locator( '.block-editor-publish-date-time-picker' )
			.getByRole( 'button', {
				name: 'Close',
			} )
			.click();
		await page.getByRole( 'button', { name: 'Change status:' } ).click();
		await page.getByRole( 'radio', { name: 'Private' } ).click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', {
				name: 'Save',
				exact: true,
			} )
			.click();

		const currentStatus = await page.evaluate( () => {
			return window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'status' );
		} );

		expect( currentStatus ).toBe( 'private' );
	} );
} );
