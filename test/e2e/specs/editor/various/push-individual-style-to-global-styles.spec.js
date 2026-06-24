/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getCurrentThemeGlobalStylesId( requestUtils ) {
	return requestUtils.getCurrentThemeGlobalStylesPostId();
}

async function getUserGlobalStyles( requestUtils ) {
	const id = await getCurrentThemeGlobalStylesId( requestUtils );
	const record = await requestUtils.rest( {
		path: `/wp/v2/global-styles/${ id }`,
	} );
	return record?.styles ?? {};
}

async function setUserGlobalStyles( requestUtils, styles ) {
	const id = await getCurrentThemeGlobalStylesId( requestUtils );
	await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/global-styles/${ id }`,
		data: { styles },
	} );
}

test.describe( 'Push individual style to Global Styles (post editor)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils, admin } ) => {
		await setUserGlobalStyles( requestUtils, {
			blocks: {
				'core/heading': { typography: { fontSize: '11px' } },
				// Seed an inherited value on the Quote block's "plain" style
				// variation so a variation-scoped override surfaces the dot menu.
				'core/quote': {
					variations: {
						plain: { typography: { fontSize: '11px' } },
					},
				},
			},
		} );
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await setUserGlobalStyles( requestUtils, {} );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'persists the pushed value when saving from the post editor', async ( {
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

		await settings
			.getByRole( 'button', { name: 'Local override options' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Make default', exact: false } )
			.click();

		// Persist through the multi-entity save panel, the flow that includes
		// the Global Styles entity.
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: false,
		} );

		const styles = await getUserGlobalStyles( requestUtils );
		expect( styles?.blocks?.[ 'core/heading' ]?.typography?.fontSize ).toBe(
			'99px'
		);
	} );

	test( 'pushes a variation-scoped override to the variation default, not the block base', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		// A Quote using its "plain" style variation, whose local font size
		// overrides the inherited variation value seeded above.
		await editor.insertBlock( {
			name: 'core/quote',
			attributes: {
				className: 'is-style-plain',
				style: { typography: { fontSize: '99px' } },
			},
		} );

		// Inserting a Quote can leave selection on its inner paragraph; select
		// the Quote itself so the inspector targets the variation-bearing block.
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Quote' } )
		);

		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await settings
			.getByRole( 'button', { name: 'Local override options' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Make default', exact: false } )
			.click();

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: false,
		} );

		// The value must land on the variation's Global Styles location, and
		// the block's base default must remain untouched.
		const styles = await getUserGlobalStyles( requestUtils );
		expect(
			styles?.blocks?.[ 'core/quote' ]?.variations?.plain?.typography
				?.fontSize
		).toBe( '99px' );
		expect(
			styles?.blocks?.[ 'core/quote' ]?.typography?.fontSize
		).toBeUndefined();
	} );
} );
