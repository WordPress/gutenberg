const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Applied typography values must stay removable when the theme disables
// their controls: the value predates the restriction or came with pasted
// or declared content, and without an affordance it can never be removed.
test.describe( 'Typography controls for values the settings gate off', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Styled',
				fontSize: 'large',
				style: { typography: { textAlign: 'center' } },
			},
		} );
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();
		// Disable font sizes and text alignment, as a theme would through
		// theme.json settings.
		await page.evaluate( () => {
			const { getSettings } =
				window.wp.data.select( 'core/block-editor' );
			const features = getSettings().__experimentalFeatures ?? {};
			window.wp.data.dispatch( 'core/block-editor' ).updateSettings( {
				__experimentalFeatures: {
					...features,
					typography: {
						...features.typography,
						defaultFontSizes: false,
						fontSizes: {},
						customFontSize: false,
						textAlign: false,
					},
				},
			} );
		} );
	} );

	test( 'resets an applied font size from a notice', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const notice = page
			.locator( '.block-editor-block-inspector' )
			.locator( '.components-notice' );
		await expect( notice ).toContainText(
			'Font size controls are disabled in this theme'
		);

		await notice.getByRole( 'button', { name: 'Reset' } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Styled',
					style: { typography: { textAlign: 'center' } },
				},
			},
		] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.fontSize
				)
			)
			.toBeUndefined();
		await expect( notice ).toBeHidden();
	} );

	test( 'clears an applied text alignment from the reduced control', async ( {
		editor,
		page,
	} ) => {
		await editor.showBlockToolbar();
		await page.locator( 'role=button[name="Align text"]' ).click();

		// Only the active alignment is offered: the value can be removed,
		// not changed.
		const options = page.locator( 'role=menuitemradio' );
		await expect( options ).toHaveCount( 1 );
		await options.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Styled', fontSize: 'large' },
			},
		] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.style?.typography
							?.textAlign
				)
			)
			.toBeUndefined();

		// With the value gone, the control leaves the toolbar.
		await editor.showBlockToolbar();
		await expect(
			page.locator( 'role=button[name="Align text"]' )
		).toBeHidden();
	} );
} );
