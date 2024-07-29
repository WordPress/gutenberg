/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'iframed block editor settings styles', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-iframed-enqueue-block-editor-settings'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-iframed-enqueue-block-editor-settings'
		);
	} );

	test( 'should load styles added through block editor settings', async ( {
		editor,
		page,
	} ) => {
		const defaultBlock = editor.canvas.getByRole( 'button', {
			name: 'Add default block',
		} );

		// Expect a red border (added in PHP).
		await expect( defaultBlock ).toHaveCSS(
			'border-color',
			'rgb(255, 0, 0)'
		);

		await page.evaluate( () => {
			const settings = window.wp.data
				.select( 'core/editor' )
				.getEditorSettings();
			window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				...settings,
				styles: [
					...settings.styles,
					{
						css: 'p { border-width: 2px; }',
						__unstableType: 'plugin',
					},
				],
			} );
		} );

		// Expect a 2px border (added in JS).
		await expect( defaultBlock ).toHaveCSS( 'border-width', '2px' );
	} );

	test( 'should load theme styles added through block editor settings', async ( {
		editor,
		page,
	} ) => {
		const defaultBlock = editor.canvas.getByRole( 'button', {
			name: 'Add default block',
		} );

		await page.evaluate( () => {
			// Make sure that theme styles are added even if the theme styles
			// preference is off.
			window.wp.data
				.dispatch( 'core/edit-post' )
				.toggleFeature( 'themeStyles' );
			const settings = window.wp.data
				.select( 'core/editor' )
				.getEditorSettings();
			window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				...settings,
				styles: [
					...settings.styles,
					{
						css: 'p { border-width: 2px; }',
						__unstableType: 'theme',
					},
				],
			} );
		} );

		// Expect a 1px border because theme styles are disabled.
		await expect( defaultBlock ).toHaveCSS( 'border-width', '1px' );

		await page.evaluate( () => {
			// Now enable theme styles.
			window.wp.data
				.dispatch( 'core/edit-post' )
				.toggleFeature( 'themeStyles' );
		} );

		// Expect a 2px border because theme styles are enabled.
		await expect( defaultBlock ).toHaveCSS( 'border-width', '2px' );
	} );

	test( 'should set iframe html attributes based on locale through block editor settings', async ( {
		editor,
		page,
	} ) => {
		const htmlElement = editor.canvas.locator( 'css=html' );
		await expect( htmlElement ).toHaveAttribute( 'lang', 'en_US' );
		await expect( htmlElement ).toHaveAttribute( 'dir', 'ltr' );

		await page.evaluate( () => {
			const settings = window.wp.data
				.select( 'core/editor' )
				.getEditorSettings();
			window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				...settings,
				siteLocale: {
					lang: 'ar',
					isRTL: true,
				},
			} );
		} );

		await expect( htmlElement ).toHaveAttribute( 'lang', 'ar' );
		await expect( htmlElement ).toHaveAttribute( 'dir', 'rtl' );
	} );
} );
