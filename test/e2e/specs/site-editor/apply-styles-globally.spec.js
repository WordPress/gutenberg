/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Reads the persisted user Global Styles record straight from the REST API so
 * the assertion exercises what was actually saved to the server, independent
 * of any in-editor merge/read behavior.
 *
 * @param {import('@wordpress/e2e-test-utils-playwright').RequestUtils} requestUtils
 * @return {Promise<Object>} The `styles` object of the user Global Styles record.
 */
async function getUserGlobalStyles( requestUtils ) {
	const id = await requestUtils.getCurrentThemeGlobalStylesPostId();
	const record = await requestUtils.rest( {
		path: `/wp/v2/global-styles/${ id }`,
	} );
	return record?.styles ?? {};
}

async function setUserGlobalStyles( requestUtils, styles ) {
	const id = await requestUtils.getCurrentThemeGlobalStylesPostId();
	await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/global-styles/${ id }`,
		data: { styles },
	} );
}

test.describe( 'Apply styles globally (site editor)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		// Clear any user-saved templates so the index template this spec edits
		// and saves cannot leak into other specs sharing the database.
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await setUserGlobalStyles( requestUtils, {} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		// The test saves the `emptytheme//index` template; remove it so it does
		// not surface in unrelated specs (e.g. the template grid views).
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await setUserGlobalStyles( requestUtils, {} );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'persists the applied value to the user Global Styles record', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'A heading',
				level: 2,
				style: { typography: { fontSize: '99px' } },
			},
		} );

		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Open the block's Advanced panel and launch the review modal.
		const advanced = settings.getByRole( 'button', { name: 'Advanced' } );
		if ( ( await advanced.getAttribute( 'aria-expanded' ) ) === 'false' ) {
			await advanced.click();
		}
		await settings
			.getByRole( 'button', { name: 'Apply globally' } )
			.click();

		const dialog = page.getByRole( 'dialog', {
			name: /Apply .* styles globally/,
		} );
		await dialog.getByRole( 'button', { name: 'Apply' } ).click();

		// Persist all dirty entities (template + global styles).
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: false,
		} );

		// The applied value must be persisted to the user Global Styles record,
		// and the now-redundant local override removed from the block markup.
		const styles = await getUserGlobalStyles( requestUtils );
		expect( styles?.blocks?.[ 'core/heading' ]?.typography?.fontSize ).toBe(
			'99px'
		);

		const template = await requestUtils.rest( {
			path: '/wp/v2/templates/emptytheme//index',
			params: { context: 'edit' },
		} );
		expect( template?.content?.raw ).not.toContain( '"fontSize":"99px"' );
	} );
} );
