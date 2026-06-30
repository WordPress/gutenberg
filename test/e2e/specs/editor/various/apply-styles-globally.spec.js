/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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

async function applyGloballyFromAdvanced( page, settings ) {
	const advanced = settings.getByRole( 'button', { name: 'Advanced' } );
	if ( ( await advanced.getAttribute( 'aria-expanded' ) ) === 'false' ) {
		await advanced.click();
	}
	await settings.getByRole( 'button', { name: 'Apply globally' } ).click();
	return page.getByRole( 'dialog', { name: /Apply .* styles globally/ } );
}

test.describe( 'Apply styles globally (post editor)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils, admin } ) => {
		await setUserGlobalStyles( requestUtils, {} );
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await setUserGlobalStyles( requestUtils, {} );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'pushes the selected styles to the block default for all blocks of the type', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
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

		const dialog = await applyGloballyFromAdvanced( page, settings );
		// Every change is selected by default; apply them all.
		await dialog.getByRole( 'button', { name: 'Apply' } ).click();

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: false,
		} );

		const styles = await getUserGlobalStyles( requestUtils );
		expect( styles?.blocks?.[ 'core/heading' ]?.typography?.fontSize ).toBe(
			'99px'
		);
	} );

	test( 'omits a deselected change from the push', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'A heading',
				level: 2,
				style: {
					typography: { fontSize: '99px' },
					color: { text: '#ff0000' },
				},
			},
		} );

		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const dialog = await applyGloballyFromAdvanced( page, settings );
		// Deselect the font size; only the text colour should be pushed.
		await dialog
			.getByRole( 'checkbox', { name: 'Font size' } )
			.setChecked( false );
		await dialog.getByRole( 'button', { name: 'Apply' } ).click();

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: false,
		} );

		const styles = await getUserGlobalStyles( requestUtils );
		// The kept change lands in Global Styles.
		expect( styles?.blocks?.[ 'core/heading' ]?.color?.text ).toBe(
			'#ff0000'
		);
		// The deselected change does not.
		expect(
			styles?.blocks?.[ 'core/heading' ]?.typography?.fontSize
		).toBeUndefined();
	} );
} );
