/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	siteEditorStyleVariations: async ( { page, requestUtils }, use ) => {
		await use( new SiteEditorStyleVariations( { page, requestUtils } ) );
	},
} );

test.describe( 'Global styles variations', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/style-variations'
		);
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-global-styles'
		);
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		// Delete all user global styles
		await requestUtils.rest( {
			method: 'DELETE',
			path: '/wp/v2/delete-all-global-styles',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
			requestUtils.rest( {
				method: 'DELETE',
				path: '/wp/v2/delete-all-global-styles',
			} ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-global-styles'
		);
	} );

	test( 'should have three variations available with the first one being active', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();

		await siteEditorStyleVariations.browseStyles();

		// TODO: instead of locating these elements by class,
		//  we could update the source code to group them in a <section> or other container,
		//  then add `aria-labelledby` and `aria-describedby` etc to provide accessible information,
		const variations = page.locator(
			'.edit-site-global-styles-variations_item'
		);

		await expect( variations ).toHaveCount( 3 );

		await expect( variations.first() ).toHaveAttribute(
			'aria-current',
			'true'
		);
		await expect( variations.nth( 1 ) ).toHaveAttribute(
			'aria-current',
			'false'
		);
		await expect( variations.nth( 2 ) ).toHaveAttribute(
			'aria-current',
			'false'
		);
	} );

	test( 'should apply preset colors and font sizes in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="pink"i]' );
		await page.click(
			'role=button[name="Navigate to the previous view"i]'
		);
		await page.click( 'role=button[name="Colors styles"i]' );

		await expect(
			page.locator(
				'role=button[name="Colors background styles"i] >> data-testid=background-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(202, 105, 211\)/ );

		await expect(
			page.locator(
				'role=button[name="Colors text styles"i] >> data-testid=text-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(74, 7, 74\)/ );

		await page.click(
			'role=button[name="Navigate to the previous view"i]'
		);
		await page.click( 'role=button[name="Typography styles"i]' );
		await page.click( 'role=button[name="Typography Text styles"i]' );

		await expect(
			page.locator( 'css=.components-font-size-picker__header__hint' )
		).toHaveText( 'Medium' );
	} );

	test( 'should apply custom colors and font sizes in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="yellow"i]' );
		await page.click(
			'role=button[name="Navigate to the previous view"i]'
		);
		await page.click( 'role=button[name="Colors styles"i]' );

		await expect(
			page.locator(
				'role=button[name="Colors background styles"i] >> data-testid=background-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(255, 239, 11\)/ );

		await expect(
			page.locator(
				'role=button[name="Colors text styles"i] >> data-testid=text-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(25, 25, 17\)/ );

		await page.click(
			'role=button[name="Navigate to the previous view"i]'
		);
		await page.click( 'role=button[name="Typography styles"i]' );
		await page.click( 'role=button[name="Typography Text styles"i]' );

		// TODO: to avoid use classnames to locate these elements,
		//  we could provide accessible attributes to the source code in packages/components/src/font-size-picker/index.js.
		await expect(
			page.locator( 'css=.components-font-size-picker__header__hint' )
		).toHaveText( 'Custom' );

		await expect(
			page.locator( 'role=spinbutton[name="Custom"i]' )
		).toHaveValue( '15' );
	} );

	test( 'should apply a color palette in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="pink"i]' );
		await page.click(
			'role=button[name="Navigate to the previous view"i]'
		);
		await page.click( 'role=button[name="Colors styles"i]' );
		await page.click( 'role=button[name="Color palettes"i]' );

		await expect(
			page.locator( 'role=button[name="Color: Foreground"i]' )
		).toHaveCSS( 'background-color', 'rgb(74, 7, 74)' );

		await expect(
			page.locator( 'role=button[name="Color: Background"i]' )
		).toHaveCSS( 'background-color', 'rgb(202, 105, 211)' );

		await expect(
			page.locator( 'role=button[name="Color: Awesome pink"i]' )
		).toHaveCSS( 'background-color', 'rgba(204, 0, 255, 0.77)' );
	} );

	test( 'should reflect style variations in the styles applied to the editor', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="yellow"i]' );

		const frame = page.frame( 'editor-canvas' );
		const paragraph = frame.locator( 'text="My awesome paragraph"' );
		await expect( paragraph ).toHaveCSS( 'color', 'rgb(25, 25, 17)' );

		const body = frame.locator( 'css=body' );
		await expect( body ).toHaveCSS(
			'background-color',
			'rgb(255, 239, 11)'
		);
	} );

	test( 'can create custom style variations', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();

		// Assert no custom styles yet.
		await siteEditorStyleVariations.browseStyles();
		await page.getByText( 'No custom styles yet.' ).click();

		// Change background color
		await page
			.getByRole( 'button', { name: 'Navigate to the previous view' } )
			.click();
		await page.getByRole( 'button', { name: 'Colors styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Colors background styles' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Color: Cyan bluish gray' } )
			.click();

		// Create new style
		await page
			.getByRole( 'button', { name: 'Navigate to the previous view' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Navigate to the previous view' } )
			.click();
		await page.getByRole( 'button', { name: 'Browse styles' } ).click();
		await page
			.locator(
				'.components-card__body > .components-flex > .components-button'
			)
			.click();
		await page.getByLabel( 'Style name' ).click();
		await page.getByLabel( 'Style name' ).fill( 'My custom style' );
		await page.getByRole( 'button', { name: 'Create' } ).click();

		// Check that the new style exists
		await page.getByRole( 'button', { name: 'My custom style' } ).click();
	} );

	test( 'can delete custom style variations', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();
		await siteEditorStyleVariations.disableWelcomeGuide();

		// Change background color
		await page.getByRole( 'button', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Colors styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Colors background styles' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Color: Cyan bluish gray' } )
			.click();

		// Create new style
		await page
			.getByRole( 'button', { name: 'Navigate to the previous view' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Navigate to the previous view' } )
			.click();
		await page.getByRole( 'button', { name: 'Browse styles' } ).click();
		await page
			.locator(
				'.components-card__body > .components-flex > .components-button'
			)
			.click();
		await page.getByLabel( 'Style name' ).click();
		await page.getByLabel( 'Style name' ).fill( 'My custom style' );
		await page.getByRole( 'button', { name: 'Create' } ).click();

		// Delete the style
		await page
			.getByRole( 'button', { name: 'My custom style' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Delete style' } ).click();

		// Check that there are no custom styles
		await page.getByText( 'No custom styles yet.' ).click();
	} );
} );

class SiteEditorStyleVariations {
	constructor( { page } ) {
		this.page = page;
	}

	async disableWelcomeGuide() {
		// Turn off the welcome guide.
		await this.page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuideStyles', false );
		} );
	}

	async browseStyles() {
		await this.disableWelcomeGuide();
		await this.page.click( 'role=button[name="Styles"i]' );
		await this.page.click( 'role=button[name="Browse styles"i]' );
	}
}
