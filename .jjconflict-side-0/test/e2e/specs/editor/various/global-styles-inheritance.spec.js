const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Inherited Global Styles in the block inspector', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Twenty Twenty-Four sets `styles.elements.heading.typography.lineHeight`
		// to 1.2, so a Heading has something to inherit.
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'shows a value inherited from the theme, with no indicator treatment', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'A heading' },
		} );
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const lineHeight = settings.getByRole( 'spinbutton', {
			name: 'Line height',
		} );

		await settings
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		const lineHeightToggle = page.getByRole( 'menuitemcheckbox', {
			name: 'Line height',
		} );
		if (
			( await lineHeightToggle.getAttribute( 'aria-checked' ) ) !== 'true'
		) {
			await lineHeightToggle.click();
		}
		await page.keyboard.press( 'Escape' );

		// The theme's value reaches the control with nothing set on the block.
		await expect( lineHeight ).toHaveValue( '1.2' );

		// The indicator treatment is behind the
		// `gutenberg-global-styles-inheritance-ui` experiment, which is off.
		await expect(
			settings.locator( '.is-inherited-from-global-styles' )
		).toHaveCount( 0 );
		await expect(
			settings.locator( '.has-local-override-from-global-styles' )
		).toHaveCount( 0 );
		await expect(
			settings.getByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).toHaveCount( 0 );
	} );
} );
