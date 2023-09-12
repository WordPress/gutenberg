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

	async setLightboxBehavior( value ) {
		// Open the "Advanced" panel
		const toggleButton = this.page.getByRole( 'button', {
			name: 'Advanced',
		} );

		const isClosed =
			( await toggleButton.getAttribute( 'aria-expanded' ) ) === 'false';

		if ( isClosed ) {
			await toggleButton.click();
		}

		// Set the value of Behaviors
		await this.page
			.getByRole( 'combobox', { name: 'Behaviors' } )
			.selectOption( 'lightbox' );
		await this.page
			.getByRole( 'combobox', { name: 'Animation' } )
			.selectOption( value );
	}

	async goToImageBlockStyles() {
		const toggleButton = this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', {
				name: 'Styles',
				disabled: false,
			} );

		const isClosed =
			( await toggleButton.getAttribute( 'aria-expanded' ) ) === 'false';

		if ( isClosed ) await toggleButton.click();

		await this.page
			.getByRole( 'button', { name: 'Blocks styles' } )
			.click();
		await this.page
			.getByRole( 'button', { name: 'Image block styles', exact: true } )
			.click();
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

		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		const revisionsMenu = page.getByRole( 'button', { name: 'Revisions' } );

		// If the button is disabled, it means that there are no revisions so we can skip
		if ( await revisionsMenu.isDisabled() ) return;
		await revisionsMenu.click();

		const resetButton = page.getByRole( 'menuitem', {
			name: 'Reset to defaults',
		} );

		// If the button is disabled, it means that there is no revision to reset to so we can skip
		if ( await resetButton.isDisabled() ) return;
		await resetButton.click();

		await editor.saveSiteEditorEntities();
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentythree' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPosts();
	} );

	test( 'Behaviors should be set to "default" by default', async ( {
		page,
		admin,
		editor,
		behaviorUtils,
	} ) => {
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		// Navigate to Styles -> Blocks -> Image
		await behaviorUtils.goToImageBlockStyles();

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
		//
		// Post editor
		//

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

		//
		// Front-end
		//

		// Go to the front-end
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		// Lightbox should be initially hidden
		const lightbox = page.getByRole( 'dialog', { name: 'Image' } );
		await expect( lightbox ).toBeHidden();

		// Click on the default image (the first image, with the "default" behavior)
		const defaultImage = page.locator( 'figure.wp-block-image' ).nth( 0 );
		await defaultImage.click();

		// Lightbox should NOT appear
		await expect( lightbox ).toBeHidden();

		// Click on the image with the zoom behavior (the second image)
		await page.locator( 'figure.wp-block-image' ).nth( 1 ).click();

		// Lightbox should appear now!
		await expect( lightbox ).toBeVisible();

		// Click on the close button of the lightbox
		const closeButton = lightbox.getByRole( 'button', {
			name: 'Close',
		} );
		await closeButton.click();

		//
		// Site editor
		//

		// Go to the site editor
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		// Navigate to Styles -> Blocks -> Image
		await behaviorUtils.goToImageBlockStyles();

		// Set the value of Behavior to "fade"
		await behaviorUtils.setLightboxBehavior( 'fade' );

		// Save the changes
		await editor.saveSiteEditorEntities();

		//
		// Front-end
		//

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

	test( 'Use the "Apply globally" button to apply the "fade" behavior as a default to all image blocks', async ( {
		page,
		editor,
		admin,
		behaviorUtils,
	} ) => {
		//
		//  Site editor
		//

		// Go to the site editor
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		let media = await behaviorUtils.createMedia();

		// Insert a new image block with default behaviors
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: 'default-image',
				url: media.source_url,
			},
		} );

		// Open the image block settings panel
		await editor.openDocumentSettingsSidebar();

		// Set the value of Behaviors to "fade"
		await behaviorUtils.setLightboxBehavior( 'fade' );

		// Click on the "Apply Globally" button
		await page.getByRole( 'button', { name: 'Apply Globally' } ).click();

		// Snackbar notification should appear
		await expect(
			page.getByText( 'Image behaviors applied.', { exact: true } )
		).toBeVisible();

		// Save the changes
		await editor.saveSiteEditorEntities();

		//
		//  Post editor
		//

		// Create a new post and an image file
		await admin.createNewPost();
		media = await behaviorUtils.createMedia();

		// Insert a new image block with default behaviors
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: 'default-image',
				url: media.source_url,
			},
		} );

		// Save & publish the post and go to the front-end
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		//
		//  Front end
		//

		// Click on the image
		const image = page.locator( 'figure.wp-block-image' ).nth( 0 );
		await image.click();

		/// Lightbox should be hidden
		const lightbox = page.getByRole( 'dialog', { name: 'Image' } );
		await expect( lightbox ).toBeVisible();

		// Get the animation type from the image
		const wpContext = await image.getAttribute( 'data-wp-context' );
		const animation = JSON.parse( wpContext ).core.image.lightboxAnimation;

		// Check that the lightbox is using the "fade" animation
		expect( animation ).toBe( 'fade' );
	} );

	test( 'Revisions work as expected with behaviors', async ( {
		page,
		editor,
		admin,
		behaviorUtils,
	} ) => {
		// Go to the site editor
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		// Navigate to Styles -> Blocks -> Image
		await behaviorUtils.goToImageBlockStyles();

		// Set the value of Image Lightbox behavior to "fade" and then to "zoom" and
		// save the changes each time.
		await behaviorUtils.setLightboxBehavior( 'fade' );
		await editor.saveSiteEditorEntities();
		await behaviorUtils.setLightboxBehavior( 'zoom' );
		await editor.saveSiteEditorEntities();

		// Go to the Revisions panel
		await page
			.getByRole( 'region', { name: 'Editor Settings' } )
			.getByRole( 'button', { name: 'Revisions' } )
			.click();

		// Open the revision history
		await page
			.getByRole( 'menuitem', { name: 'Revision history' } )
			.click();

		// Click on the previous revision
		await page
			.getByRole( 'group', {
				name: 'Global styles revisions',
			} )
			.getByRole( 'button', { name: 'Changes saved by admin' } )
			.nth( 1 )
			.click();

		// Click on the "Apply" button
		await page.getByRole( 'button', { name: 'Apply' } ).click();

		// Click on the "Close Styles" button
		await page
			.getByRole( 'button', { name: 'Navigate to the previous view' } )
			.click();

		// Navigate to Styles -> Blocks -> Image
		await behaviorUtils.goToImageBlockStyles();

		// Open the "Advanced" panel
		await page
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// Check that the value of the Image Lightbox behavior is "fade"
		await expect(
			page.getByRole( 'combobox', {
				name: 'Animation',
			} )
		).toHaveValue( 'fade' );
	} );
} );
