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
				style: {
					typography: { textAlign: 'center', letterSpacing: '2px' },
				},
			},
		} );
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();
		// Disable font sizes, letter spacing and text alignment, as a theme
		// would through theme.json settings.
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
						letterSpacing: false,
						textAlign: false,
					},
				},
			} );
		} );
	} );

	test( 'resets gated values independently from their panel rows', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const inspector = page.locator( '.block-editor-block-inspector' );
		const notice = inspector.locator( '.components-notice' );
		await expect( notice ).toContainText(
			'Some typography controls are disabled in this theme'
		);

		// Each gated value keeps its own row: the applied value in a code
		// element next to a Reset button.
		const rowFor = ( valueText ) =>
			inspector.locator( '.components-tools-panel-item' ).filter( {
				has: page.locator( 'code', { hasText: valueText } ),
			} );
		const sizeRow = rowFor( 'large' );
		const spacingRow = rowFor( '2px' );
		await expect( sizeRow.locator( 'code' ) ).toHaveText( 'large' );
		await expect( spacingRow.locator( 'code' ) ).toHaveText( '2px' );

		await sizeRow.getByRole( 'button', { name: 'Reset' } ).click();

		// Resetting one gated value leaves the others in place.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Styled',
					style: {
						typography: {
							textAlign: 'center',
							letterSpacing: '2px',
						},
					},
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
		await expect( sizeRow ).toBeHidden();

		await spacingRow.getByRole( 'button', { name: 'Reset' } ).click();

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
							.getBlocks()[ 0 ].attributes.style?.typography
							?.letterSpacing
				)
			)
			.toBeUndefined();
		// The gated text alignment value remains, so the notice stays.
		await expect( notice ).toBeVisible();
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
