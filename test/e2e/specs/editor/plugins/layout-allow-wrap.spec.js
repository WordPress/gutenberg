/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Layout Allow Wrap', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-layout-allow-wrap' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-layout-allow-wrap'
		);
	} );

	test.describe( 'Block with allowWrap: true', () => {
		test( 'shows the wrap toggle in the layout settings', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/layout-allow-wrap-true' } );
			await editor.openDocumentSettingsSidebar();

			// The wrap toggle should be visible.
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Allow to wrap to multiple lines',
				} )
			).toBeVisible();
		} );

		test( 'wrap toggle is checked by default', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/layout-allow-wrap-true' } );
			await editor.openDocumentSettingsSidebar();

			// The wrap toggle should be checked by default (flexWrap defaults to 'wrap').
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Allow to wrap to multiple lines',
				} )
			).toBeChecked();
		} );

		test( 'can toggle wrap off and on', async ( { editor, page } ) => {
			await editor.insertBlock( { name: 'test/layout-allow-wrap-true' } );
			await editor.openDocumentSettingsSidebar();

			const wrapToggle = page.getByRole( 'checkbox', {
				name: 'Allow to wrap to multiple lines',
			} );

			// Toggle off.
			await wrapToggle.click();
			await expect( wrapToggle ).not.toBeChecked();

			// Verify nowrap is in the markup.
			await expect
				.poll( editor.getEditedPostContent )
				.toContain( '"flexWrap":"nowrap"' );

			// Toggle back on.
			await wrapToggle.click();
			await expect( wrapToggle ).toBeChecked();

			// Verify wrap is restored (flexWrap should be 'wrap' or removed as it's the default).
			await expect
				.poll( editor.getEditedPostContent )
				.toContain( '"flexWrap":"wrap"' );
		} );
	} );

	test.describe( 'Block with allowWrap: false', () => {
		test( 'does not show the wrap toggle in the layout settings', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'test/layout-allow-wrap-false',
			} );
			await editor.openDocumentSettingsSidebar();

			// The wrap toggle should NOT be visible.
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Allow to wrap to multiple lines',
				} )
			).toBeHidden();
		} );

		test( 'defaults to wrap behavior when flexWrap is not set', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'test/layout-allow-wrap-false',
			} );

			// The block should not have flexWrap in its attributes since it uses the default.
			const content = await editor.getEditedPostContent();
			expect( content ).not.toContain( '"flexWrap"' );
		} );
	} );

	test.describe( 'Block with allowWrap: false and flexWrap: nowrap default', () => {
		test( 'does not show the wrap toggle in the layout settings', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'test/layout-allow-wrap-false-nowrap',
			} );
			await editor.openDocumentSettingsSidebar();

			// The wrap toggle should NOT be visible.
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Allow to wrap to multiple lines',
				} )
			).toBeHidden();
		} );
	} );
} );
