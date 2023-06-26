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

test.describe( 'Testing behaviors functionality', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPosts();
	} );
	test.beforeEach( async ( { admin, page, requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await admin.visitAdminPage(
			'/admin.php',
			'page=gutenberg-experiments'
		);

		await page
			.locator( `#gutenberg-interactivity-api-core-blocks` )
			.setChecked( true );
		await page.locator( `input[name="submit"]` ).click();
		await page.waitForLoadState();
	} );

	test.afterEach( async ( { admin, page, requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await admin.visitAdminPage(
			'/admin.php',
			'page=gutenberg-experiments'
		);

		await page
			.locator( `#gutenberg-interactivity-api-core-blocks` )
			.setChecked( false );
		await page.locator( `input[name="submit"]` ).click();
		await page.waitForLoadState();
	} );

	test( 'Behaviors UI can be disabled in the `theme.json`', async ( {
		admin,
		editor,
		requestUtils,
		page,
		behaviorUtils,
	} ) => {
		// { "lightbox": true } is the default behavior setting, so we activate the
		// `behaviors-ui-disabled` theme where it is disabled by default. Change if we change
		// the default value in the core theme.json file.
		await requestUtils.activateTheme( 'behaviors-ui-disabled' );
		await admin.createNewPost();
		const media = await behaviorUtils.createMedia();

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
			},
		} );

		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings
			.getByRole( 'button', { name: 'Advanced' } )
			.click();

		// No behaviors dropdown should be present.
		await expect(
			editorSettings.getByRole( 'combobox', {
				name: 'Behavior',
			} )
		).toBeHidden();
	} );

	test( "Block's value for behaviors takes precedence over the theme's value", async ( {
		admin,
		editor,
		requestUtils,
		page,
		behaviorUtils,
	} ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await admin.createNewPost();
		const media = await behaviorUtils.createMedia();

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
				// Explicitly set the value for behaviors to true.
				behaviors: {
					lightbox: {
						enabled: true,
						animation: 'zoom',
					},
				},
			},
		} );

		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings
			.getByRole( 'button', { name: 'Advanced' } )
			.click();
		const select = editorSettings.getByRole( 'combobox', {
			name: 'Behavior',
		} );

		// The lightbox should be selected because the value from the block's
		// attributes takes precedence over the theme's value.
		await expect( select ).toHaveValue( 'lightbox' );

		// There should be 3 options available: `No behaviors` and `Lightbox`.
		await expect( select.getByRole( 'option' ) ).toHaveCount( 3 );

		// We can change the value of the behaviors dropdown to `No behaviors`.
		await select.selectOption( { label: 'No behaviors' } );
		await expect( select ).toHaveValue( '' );

		// Here we should also check that the block renders on the frontend with the
		// lightbox even though the theme.json has it set to false.
	} );

	test( 'Lightbox behavior is disabled if the Image has a link', async ( {
		admin,
		editor,
		requestUtils,
		page,
		behaviorUtils,
	} ) => {
		// In this theme, the default value for settings.behaviors.blocks.core/image.lightbox is `true`.
		await requestUtils.activateTheme( 'behaviors-enabled' );
		await admin.createNewPost();
		const media = await behaviorUtils.createMedia();

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
				linkDestination: 'custom',
			},
		} );

		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings
			.getByRole( 'button', { name: 'Advanced' } )
			.click();
		const select = editorSettings.getByRole( 'combobox', {
			name: 'Behavior',
		} );

		// The behaviors dropdown should be present but disabled.
		await expect( select ).toBeDisabled();
	} );

	test( 'Lightbox behavior control has a default option that removes the markup', async ( {
		admin,
		editor,
		requestUtils,
		page,
		behaviorUtils,
	} ) => {
		const date = new Date();
		const year = date.getFullYear();
		const month = ( date.getMonth() + 1 ).toString().padStart( 2, '0' );
		await requestUtils.activateTheme( 'behaviors-enabled' );
		await admin.createNewPost();
		const media = await behaviorUtils.createMedia();

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
				behaviors: { lightbox: true },
			},
		} );
		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:image {"id":${ media.id },"behaviors":{"lightbox":true}} -->
<figure class="wp-block-image"><img src="http://localhost:8889/wp-content/uploads/${ year }/${ month }/1024x768_e2e_test_image_size.jpeg" alt="1024x768_e2e_test_image_size.jpeg" class="wp-image-${ media.id }"/></figure>
<!-- /wp:image -->` );

		await editor.openDocumentSettingsSidebar();

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await editorSettings
			.getByRole( 'button', { name: 'Advanced' } )
			.last()
			.click();

		const select = editorSettings.getByRole( 'combobox', {
			name: 'Behavior',
		} );

		await select.selectOption( { label: 'Default' } );
		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:image {"id":${ media.id }} -->
<figure class="wp-block-image"><img src="http://localhost:8889/wp-content/uploads/${ year }/${ month }/1024x768_e2e_test_image_size.jpeg" alt="1024x768_e2e_test_image_size.jpeg" class="wp-image-${ media.id }"/></figure>
<!-- /wp:image -->` );
	} );
} );

class BehaviorUtils {
	constructor( { page, requestUtils } ) {
		this.page = page;
		this.requestUtils = requestUtils;

		this.TEST_IMAGE_FILE_PATH = path.join(
			__dirname,
			'..',
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
