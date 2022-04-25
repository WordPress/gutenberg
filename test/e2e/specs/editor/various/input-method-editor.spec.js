/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Input Method Editor (IME)', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should hide the placeholder when composing inputs', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost();

		// Click on the default block to convert it into a paragraph block.
		await page.click( 'role=button[name="Add default block"i]' );

		const inputTarget = page.locator(
			'role=document[name=/^Empty block/i]'
		);
		const placeholder = inputTarget.locator(
			'[data-rich-text-placeholder]'
		);

		await expect( placeholder ).toBeVisible();

		// Traditional Chinese characters (Zhuyin IME).
		const inputs = [ 'ㄉ', 'ㄉㄚ', '打', '打ㄗ', '打字' ];

		await inputTarget.dispatchEvent( 'compositionstart' );
		for ( const input of inputs ) {
			await inputTarget.dispatchEvent( 'compositionupdate', {
				data: input,
			} );
		}

		await expect( placeholder ).toBeHidden();

		await inputTarget.dispatchEvent( 'compositionend', {
			data: inputs[ inputs.length - 1 ],
		} );

		await expect( placeholder ).toBeVisible();
	} );
} );
