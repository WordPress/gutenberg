/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	behaviorUtils: async ( { page, requestUtils }, use ) => {
		await use( new BehaviorUtils( { page, requestUtils } ) );
	},
} );

const filename = '1024x768_e2e_test_image_size.jpeg';

class BehaviorUtils {
	constructor( { page, requestUtils } ) {
		this.page = page;
		this.requestUtils = requestUtils;

		this.TEST_IMAGE_FILE_PATH = path.join(
			__dirname,
			'..',
			'..',
			'assets',
			filename
		);
	}

	async createMedia() {
		const media = await this.requestUtils.uploadMedia(
			this.TEST_IMAGE_FILE_PATH
		);
		return media;
	}
}

test.describe( 'Site editor behaviors', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.deleteAllPosts();
	} );

	test.beforeEach( async ( { admin, page, requestUtils, editor } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.deleteAllPosts();

		await admin.visitAdminPage(
			'/admin.php',
			'page=gutenberg-experiments'
		);
		await page
			.locator( `#gutenberg-interactivity-api-core-blocks` )
			.setChecked( true );
		await page.locator( `input[name="submit"]` ).click();
		await page.waitForLoadState();

		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page.getByRole( 'button', { name: 'Revisions' } ).click();

		// Reset to defaults if the button is available
		const resetButton = page.getByRole( 'menuitem', {
			name: 'Reset to defaults',
		} );
		if ( ! ( await resetButton.isDisabled() ) ) {
			await resetButton.click();
		}
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.activateTheme( 'twentytwentythree' );
	} );

	test.afterAll( async ( { admin, page, requestUtils } ) => {
		await admin.visitAdminPage(
			'/admin.php',
			'page=gutenberg-experiments'
		);

		await page
			.locator( `#gutenberg-interactivity-api-core-blocks` )
			.setChecked( false );
		await page.locator( `input[name="submit"]` ).click();
		await page.waitForLoadState();

		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Behaviors should be set to "default" by default', async ( {
		page,
	} ) => {
		// Navigate to Styles -> Blocks -> Image
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar.getByRole( 'button', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Blocks styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Image block styles', exact: true } )
			.click();

		// Open the advanced panel
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Check that the behavior is set to "default"
		await expect(
			page.getByRole( 'combobox', {
				name: 'Behavior',
			} )
		).toHaveValue( 'default' );
	} );

	test( 'Test updating the behaviors', async ( {
		page,
		behaviorUtils,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		const media = await behaviorUtils.createMedia();

		// First insert an image with the "default" behavior
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: 'default-image',
				url: media.source_url,
			},
		} );

		const imageDefault = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageDefault ).toBeVisible();

		// Second, insert an image with "zoom" behavior
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: 'zoom-image',
				url: media.source_url,
				behaviors: {
					lightbox: {
						enabled: true,
						animation: 'zoom',
					},
				},
			},
		} );

		const imageZoom = editor.canvas
			.locator( 'role=document[name="Block: Image"i]' )
			.nth( 1 );

		await expect( imageZoom ).toBeVisible();

		// Go to the front-end
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		// Lightbox should be hidden first
		const lightbox = page.getByRole( 'dialog', { name: 'Image' } );
		await expect( lightbox ).toBeHidden();

		// Click on the default image
		const defaultImage = page.locator( 'figure.wp-block-image' ).nth( 0 );
		await defaultImage.click();

		// Lightbox should NOT appear
		await expect( lightbox ).toBeHidden();

		// Click on the image with the zoom behavior
		await page.locator( 'figure.wp-block-image' ).nth( 1 ).click();

		// Lightbox should appear now!
		await expect( lightbox ).toBeVisible();

		// Click on the close button
		const closeButton = lightbox.getByRole( 'button', {
			name: 'Close',
		} );
		await closeButton.click();

		// Go back to the site editor
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		// Open the image settings panel
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar.getByRole( 'button', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Blocks styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Image block styles', exact: true } )
			.click();

		// Open the "Advanced" panel
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Set the value of Behavior to "fade"
		await page
			.getByRole( 'combobox', { name: 'Behaviors' } )
			.selectOption( 'lightbox' );
		await page
			.getByRole( 'combobox', { name: 'Animation' } )
			.selectOption( 'fade' );

		// Save the changes
		await editor.saveSiteEditorEntities();

		// Open the post on the front-end again
		await page.goto( `/?p=${ postId }` );

		// Click on the default image
		await defaultImage.click();

		// Lightbox should appear now because it's using the defaults and we've
		// changed the defaults in the Global Styles !!!
		await expect( lightbox ).toBeVisible();

		// Get the animation type from the image
		const wpContext = await defaultImage.getAttribute( 'data-wp-context' );
		const animation = JSON.parse( wpContext ).core.image.lightboxAnimation;

		// Check that the lightbox is using the "fade" animation
		expect( animation ).toBe( 'fade' );
	} );
} );
