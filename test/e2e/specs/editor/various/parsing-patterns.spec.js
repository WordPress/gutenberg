/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Parsing patterns', () => {
	test( 'Considers a pattern with whitespace an allowed pattern', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [ { name: 'core/button', attributes: { text: 'a' } } ],
		} );
		await page.keyboard.press( 'ArrowDown' );
		await page.getByLabel( 'Toggle block inserter' ).click();

		await page.getByRole( 'tab', { name: 'Patterns' } ).click();
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).updateSettings( {
				__experimentalBlockPatterns: [
					{
						name: 'test/whitespace',
						title: 'Pattern with top-level whitespace',
						description: '',
						content: `<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">test</a></div>
<!-- /wp:button -->

<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">test</a></div>
<!-- /wp:button -->`,
					},
				],
			} );
		} );
		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search for blocks and patterns"i]',
			'whitespace'
		);
		await page
			.locator( 'role=option[name="Pattern with top-level whitespace"i]' )
			.click();
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/buttons',
				innerBlocks: [
					{ name: 'core/button', attributes: { text: 'a' } },
					{ name: 'core/button', attributes: { text: 'test' } },
					{ name: 'core/button', attributes: { text: 'test' } },
				],
			},
		] );
	} );
} );
